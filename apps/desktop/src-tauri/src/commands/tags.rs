use crate::AppError;

async fn extract_tags_from_content(content: &str) -> Result<Vec<String>, AppError> {
    let mut tags = Vec::new();
    let mut in_fenced_code = false;
    let mut in_frontmatter = false;
    let mut lines = content.lines();
    let mut frontmatter_lines = 0;

    for line in lines.by_ref() {
        let trimmed = line.trim();

        // Track frontmatter
        if !in_fenced_code && frontmatter_lines == 0 {
            if trimmed == "---" {
                in_frontmatter = !in_frontmatter;
                continue;
            }
            if in_frontmatter {
                frontmatter_lines += 1;
                continue;
            }
        }

        // Track fenced code blocks
        if !in_frontmatter && !in_fenced_code {
            if trimmed.starts_with("```") {
                in_fenced_code = true;
                continue;
            }
        } else if in_fenced_code {
            if trimmed.starts_with("```") {
                in_fenced_code = false;
                continue;
            }
        }

        // Skip if in frontmatter or fenced code
        if in_frontmatter || in_fenced_code {
            continue;
        }

        // Match tags (case-insensitive)
        for word in line.split_whitespace() {
            if let Some(tag) = word.strip_prefix('#') {
                if !tag.is_empty() && tag.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
                    let tag_lower = tag.to_lowercase();
                    if !tags.contains(&tag_lower) {
                        tags.push(tag_lower.clone());
                    }
                }
            }
        }
    }

    Ok(tags)
}

#[tauri::command]
pub async fn get_tags_from_content(_path: String, content: String) -> Result<Vec<String>, AppError> {
    let tags = extract_tags_from_content(&content).await?;
    Ok(tags)
}
