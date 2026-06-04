use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::settings;

/// A single saved "gist": the key takeaways of an important video.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Gist {
    pub id: String,
    pub url: String,
    #[serde(default)]
    pub video_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub channel: String,
    #[serde(default)]
    pub channel_url: String,
    #[serde(default)]
    pub thumbnail_url: String,
    #[serde(default)]
    pub gist: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub created_at: String,
}

/// The currently configured data directory, created if necessary.
pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = PathBuf::from(settings::load(app)?.data_dir);
    fs::create_dir_all(&dir).map_err(|e| format!("Konnte Datenordner nicht anlegen: {e}"))?;
    Ok(dir)
}

/// Full path to the JSON data file inside a given directory.
fn file_in(dir: &Path) -> PathBuf {
    dir.join("gists.json")
}

/// Full path to the active JSON data file.
pub fn data_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(file_in(&data_dir(app)?))
}

/// Load all gists from disk. Returns an empty list if the file does not exist yet.
pub fn load_all(app: &AppHandle) -> Result<Vec<Gist>, String> {
    let path = data_file(app)?;
    read_file(&path)
}

fn read_file(path: &Path) -> Result<Vec<Gist>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents =
        fs::read_to_string(path).map_err(|e| format!("Konnte gists.json nicht lesen: {e}"))?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&contents).map_err(|e| format!("gists.json ist ungültig: {e}"))
}

/// Persist all gists to disk atomically (write to a temp file, then rename).
pub fn save_all(app: &AppHandle, gists: &[Gist]) -> Result<(), String> {
    let path = data_file(app)?;
    write_file(&path, gists)
}

fn write_file(path: &Path, gists: &[Gist]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(gists)
        .map_err(|e| format!("Konnte Daten nicht serialisieren: {e}"))?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| format!("Konnte Daten nicht schreiben: {e}"))?;
    fs::rename(&tmp, path).map_err(|e| format!("Konnte Daten nicht speichern: {e}"))?;
    Ok(())
}

/// Change the data directory, moving the existing `gists.json` to the new
/// location. Returns the new directory path.
pub fn move_data_dir(app: &AppHandle, new_dir: &str) -> Result<String, String> {
    let new_dir = PathBuf::from(new_dir.trim());
    if new_dir.as_os_str().is_empty() {
        return Err("Bitte einen gültigen Ordner wählen.".to_string());
    }
    fs::create_dir_all(&new_dir).map_err(|e| format!("Konnte Zielordner nicht anlegen: {e}"))?;

    let old_file = data_file(app)?;
    let new_file = file_in(&new_dir);

    // Only move if we are actually changing location and there is data to move.
    if old_file != new_file && old_file.exists() {
        let gists = read_file(&old_file)?;
        write_file(&new_file, &gists)?;
        let _ = fs::remove_file(&old_file);
    }

    let new_settings = settings::Settings {
        data_dir: new_dir.to_string_lossy().to_string(),
    };
    settings::save(app, &new_settings)?;
    Ok(new_settings.data_dir)
}
