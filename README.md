# VideoGists

A small native desktop app to save the **gist** (2–8 sentence key takeaways) of
important YouTube videos — so you can confirm you actually learned something and
the video wasn't just wasted time.

Paste a YouTube link, let the app auto-fill the title, channel and thumbnail,
write your takeaway in a minimal Markdown editor, and save. Everything is stored
in a plain, hand-editable `gists.json`.

## Features

- Auto-fetch title, channel and thumbnail from a YouTube link (no API key).
- Minimal Markdown editor for the gist (bold, italic, headings, lists), rendered
  in the list.
- Tags and full-text search across title, channel, gist and tags.
- Add/edit via a popup; the list is the main page.
- **Configurable data location** — point it at a cloud-synced folder (e.g. Google
  Drive). Changing the location moves `gists.json` along with it.
- Custom dark title bar that blends with the app.

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Frontend (React + TS, Vite)│  invoke│  Backend (Rust, Tauri v2)    │
│                             │ ─────► │                              │
│  App.tsx        list + modal│        │  lib.rs      tauri commands  │
│  components/     UI pieces   │ ◄───── │  storage.rs  gists.json I/O  │
│                             │ result │  settings.rs settings.json   │
│  api.ts         invoke wrap │        │  youtube.rs  oEmbed fetch    │
└─────────────────────────────┘        └──────────────────────────────┘
                                                  │
                                                  ▼
                                     <data dir>/gists.json   (your data)
                                     <config dir>/settings.json
```

- **Frontend** (`src/`) renders the UI and calls Rust via Tauri `invoke`.
  - `src/api.ts` — typed wrappers around the Tauri commands.
  - `src/components/` — `GistForm`, `GistCard`, `MarkdownEditor`, `Modal`,
    `TitleBar`.
- **Backend** (`src-tauri/src/`) holds all logic that touches the disk or network.
  - `storage.rs` — load/save `gists.json` atomically; move the file when the data
    directory changes.
  - `settings.rs` — persists the chosen data directory in `settings.json` (in the
    OS app-config dir).
  - `youtube.rs` — extracts the video id and fetches metadata via YouTube's public
    oEmbed endpoint (runs in Rust, so it isn't blocked by browser CORS).
- **Data**: `gists.json` is a plain JSON array you can edit by hand. Its location
  is configurable from within the app; the default is `Documents\VideoGists`.

## Development

Prerequisites: [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/), and on
Windows the MSVC C++ Build Tools + WebView2 (preinstalled on Win 10/11).

```powershell
npm install        # once
npm run tauri dev  # run the app with hot reload
```

## Building a portable exe

The deploy script builds a single portable `VideoGists.exe` (no installer) and
copies it to the programs folder, replacing the previous version:

```powershell
.\scripts\build-portable.ps1
# optional custom destination:
.\scripts\build-portable.ps1 -Destination 'D:\Apps\VideoGists'
```

Under the hood it runs `npm run tauri build -- --no-bundle` and copies
`src-tauri\target\release\VideoGists.exe`.

`scripts/build-portable.ps1` contains a personal deploy path and is therefore
gitignored. On a fresh clone, copy the template and adjust the default
`$Destination`:

```powershell
Copy-Item scripts/build-portable.example.ps1 scripts/build-portable.ps1
```

## Cleaning build artifacts

Remove regenerable build/cache folders (`src-tauri\target`, `dist`,
`node_modules`). Your `gists.json` lives outside the repo and is never touched:

```powershell
.\scripts\clean-temp.ps1                  # also removes node_modules
.\scripts\clean-temp.ps1 -KeepNodeModules # keep deps for a faster next build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
