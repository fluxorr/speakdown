use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    pub tag: String,
    pub file_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaggedFile {
    pub path: String,
    pub name: String,
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
    tags: HashMap<String, Vec<TaggedFile>>,
}

impl TagIndex {
    pub fn new() -> Self {
        Self {
            tags: HashMap::new(),
        }
    }

    pub fn add_document(
        &mut self,
        path: String,
        name: String,
        title: Option<String>,
        modified_at: u64,
        tags: Vec<String>,
    ) {
        for tag in &tags {
            let tag = tag.to_lowercase();
            let file = TaggedFile {
                path: path.clone(),
                name: name.clone(),
                title: title.clone(),
                modified_at,
                tags: tags.clone(),
            };
            self.tags.entry(tag).or_default().push(file.clone());
        }
    }

    pub fn remove_document(&mut self, path: &str) {
        for files in self.tags.values_mut() {
            files.retain(|f| f.path != path);
        }
        self.tags.retain(|_, files| !files.is_empty());
    }

    pub fn get_tag_info(&self) -> Vec<TagInfo> {
        let mut result: Vec<TagInfo> = self
            .tags
            .iter()
            .map(|(tag, files)| TagInfo {
                tag: tag.clone(),
                file_paths: files.iter().map(|f| f.path.clone()).collect(),
            })
            .collect();
        result.sort_by(|a, b| a.tag.cmp(&b.tag));
        result
    }

    pub fn get_documents_by_tag(&self, tag: &str) -> Vec<TaggedFile> {
        let tag = tag.to_lowercase();
        self.tags.get(&tag).cloned().unwrap_or_default()
    }
}
