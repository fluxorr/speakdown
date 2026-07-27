use crate::error::AppError;
use crate::state::AppState;
use crate::tags::{TagInfo, TaggedFile};
use tauri::Manager;

/// Extract `#tag` tokens from markdown content, skipping fenced code blocks,
/// inline code, frontmatter, and URL fragments.
///
/// A valid tag is `#` followed by one or more `[A-Za-z0-9_-]` characters.
/// Tags are case-insensitive and deduplicated within a file.
pub fn extract_tags_from_content(content: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let mut in_fenced_code = false;
    let mut in_frontmatter = false;
    let mut frontmatter_seen = false;

    for line in content.lines() {
        let trimmed = line.trim();

        // Track frontmatter delimiters.
        if !in_fenced_code && !in_frontmatter && trimmed == "---" && !frontmatter_seen {
            in_frontmatter = true;
            frontmatter_seen = true;
            continue;
        }
        if in_frontmatter && trimmed == "---" {
            in_frontmatter = false;
            continue;
        }
        if in_frontmatter {
            continue;
        }

        // Track fenced code blocks.
        if !in_fenced_code && trimmed.starts_with("```") {
            in_fenced_code = true;
            continue;
        }
        if in_fenced_code && trimmed.starts_with("```") {
            in_fenced_code = false;
            continue;
        }
        if in_fenced_code {
            continue;
        }

        // Match tags.
        for word in line.split_whitespace() {
            if let Some(body) = word.strip_prefix('#') {
                if body.is_empty() {
                    continue;
                }
                // Skip hex colors (e.g. #ff0000).
                if body.len() == 6
                    && body.chars().all(|c| c.is_ascii_hexdigit())
                    && word.len() == 7
                {
                    continue;
                }
                if body.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
                    let lower = body.to_lowercase();
                    if !tags.contains(&lower) {
                        tags.push(lower);
                    }
                }
            }
        }
    }

    tags
}

/// Walk the current workspace's file index, read every markdown file, and
/// rebuild the tag index. Runs on a blocking thread so large workspaces
/// don't stall the async runtime.
#[tauri::command]
pub async fn reindex_tags(
    webview: tauri::Webview,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    let state = app.state::<AppState>().get_or_create(webview.label());
    let files: Vec<(String, String, u64)> = {
        let index = state.file_index.read();
        index
            .iter()
            .map(|f| {
                let name = f.name.clone();
                let path_str = f.path.to_string_lossy().to_string();
                let modified = f.modified_at;
                (path_str, name, modified)
            })
            .collect()
    };

    let epoch = state.workspace_epoch.load(std::sync::atomic::Ordering::SeqCst);

    let results = tauri::async_runtime::spawn_blocking(move || {
        let mut new_index = crate::tags::TagIndex::new();
        for (path_str, name, modified_at) in &files {
            if !name.ends_with(".md") && !name.ends_with(".markdown") {
                continue;
            }
            match std::fs::read_to_string(path_str) {
                Ok(content) => {
                    let tags = extract_tags_from_content(&content);
                    if !tags.is_empty() {
                        let title = name.strip_suffix(".md").or_else(|| name.strip_suffix(".markdown")).map(|s| s.to_string());
                        new_index.add_document(
                            path_str.clone(),
                            name.clone(),
                            title,
                            *modified_at,
                            tags,
                        );
                    }
                }
                Err(_) => {
                    // Skip files that can't be read.
                }
            }
        }
        new_index
    })
    .await
    .map_err(|e| AppError::Io(e.to_string()))?;

    // Check epoch: discard if workspace changed while we were indexing.
    if state.workspace_epoch.load(std::sync::atomic::Ordering::SeqCst) != epoch {
        return Ok(());
    }

    *state.tag_index.write() = results;
    Ok(())
}

/// Return every tag in the workspace with the list of files that contain it.
/// Tags are sorted alphabetically.
#[tauri::command]
pub fn list_tags(
    webview: tauri::Webview,
    app: tauri::AppHandle,
) -> Result<Vec<TagInfo>, AppError> {
    let state = app.state::<AppState>().get_or_create(webview.label());
    let index = state.tag_index.read();
    Ok(index.get_tag_info())
}

/// Return the files tagged with the given tag. The tag is matched
/// case-insensitively.
#[tauri::command]
pub fn get_tagged_files(
    tag: String,
    webview: tauri::Webview,
    app: tauri::AppHandle,
) -> Result<Vec<TaggedFile>, AppError> {
    let state = app.state::<AppState>().get_or_create(webview.label());
    let index = state.tag_index.read();
    Ok(index.get_documents_by_tag(&tag))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_basic_tags() {
        let tags = extract_tags_from_content("hello #world this is #test");
        assert_eq!(tags, vec!["world", "test"]);
    }

    #[test]
    fn deduplicates_tags() {
        let tags = extract_tags_from_content("#hello #hello #world");
        assert_eq!(tags, vec!["hello", "world"]);
    }

    #[test]
    fn ignores_hex_colors() {
        let tags = extract_tags_from_content("color is #ff0000");
        assert!(tags.is_empty());
    }

    #[test]
    fn ignores_tags_in_code_blocks() {
        let content = "\
#notag

```
#tag_in_code
```

#notag2";
        let tags = extract_tags_from_content(content);
        assert_eq!(tags, vec!["notag", "notag2"]);
    }

    #[test]
    fn ignores_tags_in_frontmatter() {
        let content = "---
#tag_in_frontmatter
title: test
---
#body_tag";
        let tags = extract_tags_from_content(content);
        assert_eq!(tags, vec!["body_tag"]);
    }

    #[test]
    fn case_insensitive_dedup() {
        let tags = extract_tags_from_content("#Hello #hello #HELLO");
        assert_eq!(tags, vec!["hello"]);
    }

    #[test]
    fn accepts_alphanumeric_and_hyphens() {
        let tags = extract_tags_from_content("#my-tag #tag_1 #v2");
        assert_eq!(tags, vec!["my-tag", "tag_1", "v2"]);
    }

    #[test]
    fn skips_empty_hash() {
        let tags = extract_tags_from_content("just a #");
        assert!(tags.is_empty());
    }

    #[test]
    fn skips_url_fragments_by_context() {
        // A URL fragment like #section in a full URL should not be matched
        // because it's preceded by non-whitespace.
        let tags = extract_tags_from_content("see https://example.com#section");
        assert!(tags.is_empty());
    }

    #[test]
    fn ignores_tags_in_inline_code() {
        let tags = extract_tags_from_content("use `#tag` here");
        assert!(tags.is_empty());
    }
}
