import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export function TitleBar() {
    return (
        <div className="titlebar" data-tauri-drag-region>
            <span className="titlebar-title" data-tauri-drag-region>
                VideoGists
            </span>
            <div className="titlebar-controls">
                <button
                    className="tb-btn"
                    aria-label="Minimieren"
                    onClick={() => appWindow.minimize()}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
                    </svg>
                </button>
                <button
                    className="tb-btn"
                    aria-label="Maximieren"
                    onClick={() => appWindow.toggleMaximize()}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <rect
                            x="0.5"
                            y="0.5"
                            width="9"
                            height="9"
                            fill="none"
                            stroke="currentColor"
                        />
                    </svg>
                </button>
                <button
                    className="tb-btn tb-close"
                    aria-label="Schließen"
                    onClick={() => appWindow.close()}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0 0 L10 10 M10 0 L0 10" stroke="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
