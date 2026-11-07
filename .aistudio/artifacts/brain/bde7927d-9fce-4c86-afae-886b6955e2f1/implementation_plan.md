# Dependency Pruning & Local Database Persistence Fix

Clean, lightweight, dependency-pruned architecture for PulseTube with crash-resilient local persistence for queue items, download history, and engine settings.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been aligned based on your responses:

- **Confirmed Decision 1**: Prune all unused packages (`@distube/ytdl-core`, `@google/genai`, `motion`, `dotenv`, and `autoprefixer`) from `package.json`, keeping only the lean core React 19, Express, Vite, and Lucide icons.
- **Confirmed Decision 2**: Implement a resilient local JSON database engine on the backend (`pulsetube-db.json`) with atomic temp-file swaps for queue and settings persistence, plus client-side `localStorage` sync to prevent duplicate downloads and IndexedDB permission errors.

---

## 1. Overview & Core Concept

- **What It Does**: PulseTube is a high-speed video and audio download engine with batch processing and local folder synchronization. This update strips out all unused bloatware packages from the repository, resolves database persistence failures (interrupted downloads lost on restart, duplicate download re-triggers, orphaned temp files), and introduces an atomic local storage database layer.
- **Target Audience / Persona**: Users who want a lightweight, fast, zero-bloat YouTube media downloader running locally or in container environments without unnecessary background overhead.
- **Key Value**: Reduced bundle size and faster startup, zero memory leaks, and 100% resilient queue retention across reboots and page refreshes.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - *Adding & Batch Queuing*: Paste YouTube links or click sample batches; items immediately persist in the local database with status `queued` or `downloading`.
  - *Resuming After Reload*: If the server or browser restarts while downloads were in progress, items are recovered from `pulsetube-db.json` in a safe `paused` state ready for 1-click resumption.
  - *Auto-Save to Local Folder*: Downloads complete and save to the user's designated directory exactly once, tracking `savedToLocalFolder` in database state to prevent repeated duplicate browser downloads.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Refined utilitarian media dashboard with dark slate surfaces, subtle 1px hairline borders (`border-neutral-800`), and tabular figures.
  - *Color Palette*: Slate-950 canvas (`#020617`), Slate-900 card surfaces (`#0f172a`), emerald green for active downloads (`#10b981`), amber for pauses (`#f59e0b`), and crimson for error states (`#ef4444`).
  - *Typography*: Plus Jakarta Sans for interface headings and body, JetBrains Mono with tabular numbers (`tabular-nums`) for transfer rates, ETAs, and file sizes.
- **Interactive Feedback & Motion**: Lightweight native CSS transitions ($\le 180\text{ms}$) replacing heavy JavaScript animation libraries (`motion`), responsive hover states, and clear empty/loading states.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removal of Unused Dependencies**:
  - *Chosen Approach*: Remove `@distube/ytdl-core`, `@google/genai`, `motion`, `dotenv`, and `autoprefixer`. Keep only `express`, `react`, `react-dom`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `tsx`, and `typescript`.
  - *Why*: `@distube/ytdl-core` was never imported (the server uses `yt-dlp` and `ffmpeg` directly). `@google/genai` was never wired into any feature. `motion` was unimported in all components. `dotenv` is redundant in Node.js 22.
  - *Alternatives Considered*: Keeping them as optional stubs — rejected because user explicitly requested removing dependencies from the project.
- **Decision 2: Atomic Local Database Engine (`pulsetube-db.json`)**:
  - *Chosen Approach*: Lightweight single-file database helper with atomic writes (`write to .tmp` then `fs.renameSync`), automated schema migrations, and in-memory caching.
  - *Why*: Eliminates corruption from interrupted writes, requires zero external database dependencies (no postgres/sqlite native binaries needed), and persists seamlessly across container and local restarts.
  - *Alternatives Considered*: SQLite (`better-sqlite3`) — rejected because native C++ binary addons often break across slim container architectures and require extra packages.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       React 19 Client                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │ AddDownloadBar  │  │  QueueItemCards  │  │  StatsBar  │  │
│  └────────┬────────┘  └────────┬─────────┘  └─────┬──────┘  │
│           │                    │                  │         │
│           └────────────────────┼──────────────────┘         │
│                                │                            │
│                  ┌─────────────┴─────────────┐              │
│                  │  api.ts & LocalFolderSvc  │              │
│                  └─────────────┬─────────────┘              │
└────────────────────────────────┼────────────────────────────┘
                                 │ HTTP REST (/api/*)
┌────────────────────────────────┴────────────────────────────┐
│                    Express Backend Server                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                Process & Download Manager             │  │
│  │         yt-dlp binary  /  ffmpeg synthesizer          │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│              ┌──────────────┴──────────────┐                │
│              │    Atomic Local Database    │                │
│              │     (pulsetube-db.json)     │                │
│              │   • queueItems: QueueItem[] │                │
│              │   • settings: EngineConfig  │                │
│              │   • fileRegistry: string[]  │                │
│              └─────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

- **Database Schema**:
  - `items`: List of download jobs containing `id`, `url`, `title`, `author`, `thumbnail`, `duration`, `format`, `quality`, `audioCodec`, `status`, `progress`, `speed`, `fileSize`, `filePath`, `fileName`, `savedToLocalFolder`, `createdAt`, `completedAt`, `error`.
  - `settings`: Engine concurrency limit, fragment count, turbo mode, default format/qualities, and cookies.
- **Bug Fixes Targeted**:
  1. **Queue Persistence & Crash Recovery**: Queue items are committed to disk whenever added, paused, or finished. Interrupted downloads are safely marked `paused` upon reboot.
  2. **Duplicate Auto-Download Loop**: Track `savedToLocalFolder: boolean` on each item to ensure browser auto-saving only triggers once per download, even across reloads.
  3. **Safe IndexedDB Handling**: Wrap `showDirectoryPicker` and IndexedDB handle queries in strict error boundaries with graceful fallback to standard browser downloads.
  4. **Orphan File Cleanup**: Fix `clear-completed` and `delete` handlers to remove completed output files from the disk when requested.
