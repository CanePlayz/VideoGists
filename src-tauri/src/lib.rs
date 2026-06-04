mod settings;
mod storage;
mod youtube;

use chrono::Utc;
use serde::Deserialize;
use storage::Gist;
use tauri::AppHandle;
use youtube::VideoMetadata;

/// Data sent from the frontend when creating or updating a gist.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GistInput {
    url: String,
    #[serde(default)]
    video_id: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    channel: String,
    #[serde(default)]
    channel_url: String,
    #[serde(default)]
    thumbnail_url: String,
    #[serde(default)]
    gist: String,
    #[serde(default)]
    tags: Vec<String>,
}

#[tauri::command]
fn list_gists(app: AppHandle) -> Result<Vec<Gist>, String> {
    storage::load_all(&app)
}

#[tauri::command]
fn add_gist(app: AppHandle, input: GistInput) -> Result<Gist, String> {
    let gist = Gist {
        id: uuid::Uuid::new_v4().to_string(),
        url: input.url,
        video_id: input.video_id,
        title: input.title,
        channel: input.channel,
        channel_url: input.channel_url,
        thumbnail_url: input.thumbnail_url,
        gist: input.gist,
        tags: input.tags,
        created_at: Utc::now().to_rfc3339(),
    };

    let mut all = storage::load_all(&app)?;
    all.insert(0, gist.clone());
    storage::save_all(&app, &all)?;
    Ok(gist)
}

#[tauri::command]
fn update_gist(app: AppHandle, id: String, input: GistInput) -> Result<Gist, String> {
    let mut all = storage::load_all(&app)?;
    let item = all
        .iter_mut()
        .find(|g| g.id == id)
        .ok_or_else(|| "Eintrag nicht gefunden.".to_string())?;

    item.url = input.url;
    item.video_id = input.video_id;
    item.title = input.title;
    item.channel = input.channel;
    item.channel_url = input.channel_url;
    item.thumbnail_url = input.thumbnail_url;
    item.gist = input.gist;
    item.tags = input.tags;

    let updated = item.clone();
    storage::save_all(&app, &all)?;
    Ok(updated)
}

#[tauri::command]
fn delete_gist(app: AppHandle, id: String) -> Result<(), String> {
    let mut all = storage::load_all(&app)?;
    all.retain(|g| g.id != id);
    storage::save_all(&app, &all)
}

#[tauri::command]
async fn fetch_metadata(url: String) -> Result<VideoMetadata, String> {
    youtube::fetch_metadata(&url).await
}

#[tauri::command]
fn get_data_dir(app: AppHandle) -> Result<String, String> {
    Ok(settings::load(&app)?.data_dir)
}

#[tauri::command]
fn set_data_dir(app: AppHandle, dir: String) -> Result<String, String> {
    storage::move_data_dir(&app, &dir)
}

#[tauri::command]
fn open_data_folder(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let dir = storage::data_dir(&app)?;
    app.opener()
        .open_path(dir.to_string_lossy(), None::<&str>)
        .map_err(|e| format!("Konnte Ordner nicht öffnen: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_gists,
            add_gist,
            update_gist,
            delete_gist,
            fetch_metadata,
            get_data_dir,
            set_data_dir,
            open_data_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
