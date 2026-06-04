/** A saved video gist as stored in gists.json and returned by the backend. */
export interface Gist {
    id: string;
    url: string;
    videoId: string;
    title: string;
    channel: string;
    channelUrl: string;
    thumbnailUrl: string;
    gist: string;
    tags: string[];
    createdAt: string;
}

/** Metadata fetched from YouTube for a given URL. */
export interface VideoMetadata {
    videoId: string;
    title: string;
    channel: string;
    channelUrl: string;
    thumbnailUrl: string;
}

/** Payload sent to the backend when creating or updating a gist. */
export interface GistInput {
    url: string;
    videoId: string;
    title: string;
    channel: string;
    channelUrl: string;
    thumbnailUrl: string;
    gist: string;
    tags: string[];
}
