use serde::{Deserialize, Serialize};

/// Metadata fetched from YouTube for a given video URL.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoMetadata {
    pub video_id: String,
    pub title: String,
    pub channel: String,
    pub channel_url: String,
    pub thumbnail_url: String,
}

/// Shape of the relevant fields returned by the YouTube oEmbed endpoint.
#[derive(Debug, Deserialize)]
struct OEmbedResponse {
    title: String,
    author_name: String,
    author_url: String,
}

/// Extract the 11-character YouTube video id from the common URL formats:
/// `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`.
pub fn extract_video_id(url: &str) -> Option<String> {
    let trimmed = url.trim();

    // Strip scheme and split off query/fragment helpers later.
    let without_scheme = trimmed
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.");

    // youtu.be/<id>
    if let Some(rest) = without_scheme.strip_prefix("youtu.be/") {
        return clean_id(rest);
    }

    // youtube.com/watch?v=<id>
    if without_scheme.starts_with("youtube.com/watch") || without_scheme.starts_with("m.youtube.com/watch") {
        if let Some(query) = trimmed.split_once('?').map(|(_, q)| q) {
            for pair in query.split('&') {
                if let Some(v) = pair.strip_prefix("v=") {
                    return clean_id(v);
                }
            }
        }
    }

    // youtube.com/shorts/<id> or /embed/<id> or /live/<id>
    for marker in ["/shorts/", "/embed/", "/live/"] {
        if let Some(idx) = without_scheme.find(marker) {
            let rest = &without_scheme[idx + marker.len()..];
            return clean_id(rest);
        }
    }

    None
}

/// Take the leading id segment and validate it loosely (length & charset).
fn clean_id(raw: &str) -> Option<String> {
    let id: String = raw
        .chars()
        .take_while(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if id.len() >= 10 {
        Some(id)
    } else {
        None
    }
}

/// Fetch video metadata from YouTube's public oEmbed endpoint (no API key needed).
pub async fn fetch_metadata(url: &str) -> Result<VideoMetadata, String> {
    let video_id = extract_video_id(url)
        .ok_or_else(|| "Das sieht nicht nach einem gültigen YouTube-Link aus.".to_string())?;

    let oembed_url = format!(
        "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    );

    let client = reqwest::Client::builder()
        .user_agent("VideoGists/0.1")
        .build()
        .map_err(|e| format!("Konnte HTTP-Client nicht erstellen: {e}"))?;

    let resp = client
        .get(&oembed_url)
        .send()
        .await
        .map_err(|e| format!("Netzwerkfehler beim Abrufen der Metadaten: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!(
            "YouTube hat die Metadaten nicht geliefert (Status {}). Bitte Felder manuell ausfüllen.",
            resp.status()
        ));
    }

    let data: OEmbedResponse = resp
        .json()
        .await
        .map_err(|e| format!("Konnte Metadaten nicht lesen: {e}"))?;

    Ok(VideoMetadata {
        thumbnail_url: format!("https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
        video_id,
        title: data.title,
        channel: data.author_name,
        channel_url: data.author_url,
    })
}
