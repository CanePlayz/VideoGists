use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// Persisted application settings (stored separately from the gist data).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    /// Directory that contains `gists.json`. An empty value means "portable":
    /// use the folder next to the executable. A non-empty value is an explicit
    /// override chosen by the user (e.g. a cloud-synced folder).
    #[serde(default)]
    pub data_dir: String,
}

/// Fixed location of the settings file (always in the app config dir).
fn settings_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Konnte Konfigurationsordner nicht ermitteln: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Konnte Konfigurationsordner nicht anlegen: {e}"))?;
    Ok(dir.join("settings.json"))
}

/// Default data directory: the folder that contains the executable, so the
/// app is fully portable and `gists.json` always lives next to the `.exe`.
/// Falls back to the app data dir if the executable path is unavailable.
fn default_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return Ok(dir.to_path_buf());
        }
    }
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Konnte Standard-Datenordner nicht ermitteln: {e}"))
}

/// Load the effective settings. When no explicit override has been saved, the
/// data directory always resolves to the folder next to the executable, so the
/// app stays portable and never freezes a device-specific absolute path.
pub fn load(app: &AppHandle) -> Result<Settings, String> {
    let mut settings = load_raw(app)?;
    if settings.data_dir.trim().is_empty() {
        settings.data_dir = default_data_dir(app)?.to_string_lossy().to_string();
    }
    Ok(settings)
}

/// Read the persisted settings verbatim (an empty `data_dir` means portable).
fn load_raw(app: &AppHandle) -> Result<Settings, String> {
    let path = settings_file(app)?;
    if path.exists() {
        let contents =
            fs::read_to_string(&path).map_err(|e| format!("Konnte settings.json nicht lesen: {e}"))?;
        if let Ok(settings) = serde_json::from_str::<Settings>(&contents) {
            return Ok(settings);
        }
    }
    Ok(Settings::default())
}

/// Persist settings to disk.
pub fn save(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_file(app)?;
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Konnte Einstellungen nicht serialisieren: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Konnte Einstellungen nicht speichern: {e}"))
}
