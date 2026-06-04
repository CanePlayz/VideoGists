import { useEffect, useState } from "react";
import type { Gist, GistInput } from "../types";
import { fetchMetadata } from "../api";

interface Props {
    /** When set, the form edits this existing gist; otherwise it creates a new one. */
    editing: Gist | null;
    onSubmit: (input: GistInput) => Promise<void>;
    onCancel: () => void;
}

const emptyForm = {
    url: "",
    videoId: "",
    title: "",
    channel: "",
    channelUrl: "",
    thumbnailUrl: "",
    gist: "",
    tags: "",
};

export function GistForm({ editing, onSubmit, onCancel }: Props) {
    const [form, setForm] = useState({ ...emptyForm });
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editing) {
            setForm({
                url: editing.url,
                videoId: editing.videoId,
                title: editing.title,
                channel: editing.channel,
                channelUrl: editing.channelUrl,
                thumbnailUrl: editing.thumbnailUrl,
                gist: editing.gist,
                tags: editing.tags.join(", "),
            });
        } else {
            setForm({ ...emptyForm });
        }
        setError(null);
    }, [editing]);

    function update<K extends keyof typeof form>(key: K, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleFetch() {
        if (!form.url.trim()) return;
        setLoadingMeta(true);
        setError(null);
        try {
            const meta = await fetchMetadata(form.url.trim());
            setForm((f) => ({
                ...f,
                videoId: meta.videoId,
                title: meta.title,
                channel: meta.channel,
                channelUrl: meta.channelUrl,
                thumbnailUrl: meta.thumbnailUrl,
            }));
        } catch (e) {
            setError(String(e));
        } finally {
            setLoadingMeta(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.url.trim()) {
            setError("Bitte gib einen Video-Link ein.");
            return;
        }
        if (!form.gist.trim()) {
            setError("Bitte schreibe die Kernaussage (Gist).");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const input: GistInput = {
                url: form.url.trim(),
                videoId: form.videoId.trim(),
                title: form.title.trim(),
                channel: form.channel.trim(),
                channelUrl: form.channelUrl.trim(),
                thumbnailUrl: form.thumbnailUrl.trim(),
                gist: form.gist.trim(),
                tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            };
            await onSubmit(input);
        } catch (e) {
            setError(String(e));
            setSaving(false);
        }
    }

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h2>{editing ? "Gist bearbeiten" : "Neuen Gist speichern"}</h2>

            <label>
                YouTube-Link
                <div className="url-row">
                    <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=…"
                        value={form.url}
                        onChange={(e) => update("url", e.target.value)}
                    />
                    <button type="button" onClick={handleFetch} disabled={loadingMeta || !form.url.trim()}>
                        {loadingMeta ? "Lade…" : "Metadaten holen"}
                    </button>
                </div>
            </label>

            <div className="grid-2">
                <label>
                    Titel
                    <input value={form.title} onChange={(e) => update("title", e.target.value)} />
                </label>
                <label>
                    Kanal
                    <input value={form.channel} onChange={(e) => update("channel", e.target.value)} />
                </label>
            </div>

            <label>
                Gist (Kernaussagen, 2–8 Sätze · Markdown)
                <textarea
                    rows={6}
                    placeholder="Was war die wichtigste Erkenntnis aus diesem Video?"
                    value={form.gist}
                    onChange={(e) => update("gist", e.target.value)}
                />
            </label>

            <label>
                Tags (kommagetrennt)
                <input
                    placeholder="z. B. Produktivität, Rust"
                    value={form.tags}
                    onChange={(e) => update("tags", e.target.value)}
                />
            </label>

            {error && <p className="error">{error}</p>}

            <div className="actions">
                <button type="submit" disabled={saving}>
                    {saving ? "Speichere…" : editing ? "Änderungen speichern" : "Gist speichern"}
                </button>
                <button type="button" className="secondary" onClick={onCancel}>
                    Abbrechen
                </button>
            </div>
        </form>
    );
}
