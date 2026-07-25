use crate::{AppError, config::Settings};
use std::fs::File;
use std::io::Write;

/// Write settings to file with atomic write to prevent corruption.
/// This replaces the manual temp file approach in config.rs.
pub fn write_settings_atomic(path: &str, settings: &Settings) -> Result<(), AppError> {
    let temp_path = format!(".{}~{}", path, uuid::Uuid::new_v4());

    // Serialize to TOML
    let content = toml::to_string(settings)?;

    // Write to temp file
    File::create(&temp_path)?.write_all(content.as_bytes())?;

    // Atomic rename
    std::fs::rename(&temp_path, path)?;

    Ok(())
}
