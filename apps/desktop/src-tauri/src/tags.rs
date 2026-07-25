export interface TagInfo {
  tag: string;
  file_paths: Vec<String>;
}

pub struct TaggedFile {
  pub path: String,
  pub title: Option<String>,
  pub modified_at: u64,
  pub tags: Vec<String>,
}

impl TaggedFile {
  pub fn path(&self) -> &str {
    &self.path
  }
}

pub struct TagIndex {
  tags: std::collections::HashMap<String, Vec<TaggedFile>>,
}

impl TagIndex {
  pub fn new() -> Self {
    Self {
      tags: std::collections::HashMap::new(),
    }
  }

  pub fn add_document(&mut self, path: String, title: Option<String>, modified_at: u64, tags: Vec<String>) {
    for tag in tags.iter() {
      self.tags.entry(tag.clone()).or_default().push(TaggedFile {
        path: path.clone(),
        title: title.clone(),
        modified_at,
        tags: tags.clone(),
      });
    }
  }

  pub fn remove_document(&mut self, path: &str) {
    for files in self.tags.values_mut() {
      files.retain(|f| f.path != path);
    }
    self.tags.retain(|_, files| !files.is_empty());
  }

  pub fn get_documents_by_tag(&self, tag: &str) -> Vec<TaggedFile> {
    self.tags.get(tag).cloned().unwrap_or_default()
  }

  pub fn get_tag_info(&self) -> Vec<TagInfo> {
    let mut result: Vec<TagInfo> = self.tags.iter()
      .map(|(tag, files)| TagInfo {
        tag: tag.clone(),
        file_paths: files.iter().map(|f| f.path.clone()).collect(),
      })
      .collect();
    result.sort_by(|a, b| a.tag.cmp(&b.tag));
    result
  }
}

pub fn extract_tags_from_content(content: &str) -> Vec<String> {
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
            tags.push(tag_lower);
          }
        }
      }
    }
  }

  tags
}
