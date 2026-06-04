import { invoke } from "@tauri-apps/api/core";
import type { Gist, GistInput, VideoMetadata } from "./types";

export function listGists(): Promise<Gist[]> {
    return invoke<Gist[]>("list_gists");
}

export function addGist(input: GistInput): Promise<Gist> {
    return invoke<Gist>("add_gist", { input });
}

export function updateGist(id: string, input: GistInput): Promise<Gist> {
    return invoke<Gist>("update_gist", { id, input });
}

export function deleteGist(id: string): Promise<void> {
    return invoke<void>("delete_gist", { id });
}

export function fetchMetadata(url: string): Promise<VideoMetadata> {
    return invoke<VideoMetadata>("fetch_metadata", { url });
}

export function getDataDir(): Promise<string> {
    return invoke<string>("get_data_dir");
}

export function setDataDir(dir: string): Promise<string> {
    return invoke<string>("set_data_dir", { dir });
}

export function openDataFolder(): Promise<void> {
    return invoke<void>("open_data_folder");
}
