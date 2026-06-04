import { useEffect, useMemo, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import "./App.css";
import type { Gist, GistInput } from "./types";
import {
  addGist,
  deleteGist,
  getDataDir,
  listGists,
  openDataFolder,
  setDataDir,
  updateGist,
} from "./api";
import { GistForm } from "./components/GistForm";
import { GistCard } from "./components/GistCard";
import { Modal } from "./components/Modal";
import { TitleBar } from "./components/TitleBar";
import { ViewSwitcher, type ViewMode } from "./components/ViewSwitcher";

const PAGE_SIZE = 24;

function loadViewMode(): ViewMode {
  const v = localStorage.getItem("videogists.view");
  return v === "compact" || v === "list" ? v : "comfortable";
}

function App() {
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dataDir, setDataDirState] = useState("");
  const [view, setView] = useState<ViewMode>(loadViewMode);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Modal state: null = closed, "new" = create, Gist = editing that gist.
  const [modal, setModal] = useState<"new" | Gist | null>(null);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      setGists(await listGists());
    } catch (e) {
      setLoadError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getDataDir().then(setDataDirState).catch(() => { });
  }, []);

  async function handleCreate(input: GistInput) {
    const created = await addGist(input);
    setGists((prev) => [created, ...prev]);
    setModal(null);
  }

  async function handleUpdate(input: GistInput) {
    if (modal === "new" || modal === null) return;
    const updated = await updateGist(modal.id, input);
    setGists((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setModal(null);
  }

  async function handleDelete(gist: Gist) {
    const ok = window.confirm(
      `Diesen Gist wirklich löschen?\n\n„${gist.title || gist.url}“`
    );
    if (!ok) return;
    await deleteGist(gist.id);
    setGists((prev) => prev.filter((g) => g.id !== gist.id));
  }

  async function handleChangeDir() {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Speicherort für gists.json wählen",
    });
    if (typeof selected !== "string") return;
    try {
      const dir = await setDataDir(selected);
      setDataDirState(dir);
      await refresh();
    } catch (e) {
      window.alert(String(e));
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gists;
    return gists.filter((g) =>
      [g.title, g.channel, g.gist, ...g.tags].join(" ").toLowerCase().includes(q)
    );
  }, [gists, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset the infinite-scroll window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, gists]);

  useEffect(() => {
    localStorage.setItem("videogists.view", view);
  }, [view]);

  // Load more as the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visible.length]);

  const editing = modal && modal !== "new" ? modal : null;

  return (
    <>
      <TitleBar />
      <div className="app">
        <header className="app-header">
          <h1>VideoGists</h1>
          <button onClick={() => setModal("new")}>+ Neuer Gist</button>
        </header>

        <section className="list-section">
          <div className="list-header">
            <h2>
              Gespeicherte Gists <span className="count">({filtered.length})</span>
            </h2>
            <div className="list-controls">
              <input
                className="search"
                type="search"
                placeholder=""
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ViewSwitcher value={view} onChange={setView} />
            </div>
          </div>

          {loading && <p className="muted">Lade…</p>}
          {loadError && <p className="error">{loadError}</p>}

          {!loading && !loadError && filtered.length === 0 && (
            <p className="muted empty">
              {gists.length === 0
                ? "Noch keine Gists gespeichert. Füge oben deinen ersten hinzu!"
                : "Keine Treffer für deine Suche."}
            </p>
          )}

          <div className={`gist-grid view-${view}`}>
            {visible.map((g) => (
              <GistCard
                key={g.id}
                gist={g}
                view={view}
                onEdit={(gg) => setModal(gg)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="scroll-sentinel" aria-hidden />}
        </section>

        <footer className="app-footer">
          <span className="muted path" title={dataDir}>
            Speicherort: {dataDir || "…"}
          </span>
          <div className="footer-actions">
            <button className="link-btn" onClick={() => openDataFolder()}>
              Ordner öffnen
            </button>
            <button className="link-btn" onClick={handleChangeDir}>
              Ändern…
            </button>
          </div>
        </footer>
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)}>
        <GistForm
          editing={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </>
  );
}

export default App;
