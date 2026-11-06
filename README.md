# Ripcord — High-Speed Stream Ripper & Local Archive

> 🚀 **Launch Online (No Install Needed)**: [**Open Ripcord Live**](https://ais-pre-c7ljzpbr3rihngtwqdrgmy-504758234967.asia-east1.run.app)

Ripcord is a high-speed media downloader and queue management dashboard designed to extract video (MP4) and audio (MP3/M4A/FLAC) streams directly to a designated local folder on your computer.

## Key Features

- **Direct Local Storage Saving**: Uses the browser's native **File System Access API** (`window.showDirectoryPicker()`) to stream downloads directly to any chosen folder on your hard drive (e.g., `~/Downloads/YouTube` or `D:\Media`).
- **Video & Audio Separation**:
  - **Video (MP4)**: Best available (up to 4K), 1080p Full HD, 720p HD, 480p, 360p.
  - **Audio (MP3 / M4A / FLAC / WAV)**: High fidelity 320 kbps, 256 kbps, 192 kbps, 128 kbps.
- **Batch Download Queue**: Multi-URL batch drawer for pasting tens of links at once with format presets.
- **Maximum Speed Engine**:
  - Parallel chunk fragmentation (4x, 8x, 16x streams).
  - Configurable concurrency limit (1 to 8 concurrent active downloads).
  - Turbo Boost mode with optimized buffer allocations and ultrafast FFmpeg remuxing.
- **Queue Management Dashboard**:
  - Live progress bars with download percentage, transfer speed (`MB/s`), and ETA.
  - Controls: Pause All, Resume All, Cancel, Retry, Clear Completed, Save All to Folder.
  - Built-in media player modal to preview completed video and audio files instantly.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [FFmpeg](https://ffmpeg.org/) (installed and available in `PATH`)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (optional: auto-downloaded or placed in `bin/yt-dlp`)

## Quick 1-Click Launch

### Option A: 1-Click Launchers (Easiest)

- **Windows**: Double-click `start.bat`
- **Mac / Linux**: Double-click or run `./start.sh`

The launcher automatically installs dependencies, prepares `yt-dlp` for your OS, launches the local server, and automatically pops open `http://localhost:3000` in your default browser!

---

### Option B: Manual Command Line

```bash
# 1. Clone repository
git clone https://github.com/shloky-11/ripcord.git
cd ripcord

# 2. Install dependencies & start
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express, Vite middleware
- **Media Engines**: yt-dlp, FFmpeg, YouTube oEmbed API
- **Storage**: Browser File System Access API & IndexedDB
