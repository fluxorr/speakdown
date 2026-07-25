// Type definitions for tags
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    pub tag: String,
    pub file_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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
