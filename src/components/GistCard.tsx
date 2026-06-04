import { openUrl } from "@tauri-apps/plugin-opener";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Gist } from "../types";
import type { ViewMode } from "./ViewSwitcher";

interface Props {
    gist: Gist;
    view: ViewMode;
    onEdit: (g: Gist) => void;
    onDelete: (g: Gist) => void;
}

function open(e: React.MouseEvent, url: string) {
    e.preventDefault();
    if (url) openUrl(url);
}

export function GistCard({ gist, view, onEdit, onDelete }: Props) {
    const showThumb = gist.thumbnailUrl && view !== "list";
    const showGist = view !== "list" && gist.gist.trim().length > 0;

    return (
        <article className={`card gist-card view-${view}`}>
            <div className="gist-body">
                {showThumb && (
                    <a
                        href={gist.url}
                        onClick={(e) => open(e, gist.url)}
                        className="thumb-link"
                    >
                        <img src={gist.thumbnailUrl} alt={gist.title} />
                    </a>
                )}
                <h3>
                    <a href={gist.url} onClick={(e) => open(e, gist.url)}>
                        {gist.title || gist.url}
                    </a>
                </h3>
                {gist.channel && (
                    <p className="meta">
                        {gist.channelUrl ? (
                            <a href={gist.channelUrl} onClick={(e) => open(e, gist.channelUrl)}>
                                {gist.channel}
                            </a>
                        ) : (
                            gist.channel
                        )}
                    </p>
                )}
                {showGist && (
                    <div className="gist-text markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{gist.gist}</ReactMarkdown>
                    </div>
                )}
                {gist.tags.length > 0 && (
                    <div className="tags">
                        {gist.tags.map((t) => (
                            <span className="tag" key={t}>
                                {t}
                            </span>
                        ))}
                    </div>
                )}
                <div className="card-actions">
                    <button className="link-btn" onClick={() => onEdit(gist)}>
                        Bearbeiten
                    </button>
                    <button className="link-btn danger" onClick={() => onDelete(gist)}>
                        Löschen
                    </button>
                </div>
            </div>
        </article>
    );
}
