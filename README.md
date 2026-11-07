# Ripcord — Fast Video & Audio Downloader

A high-speed media downloader and queue management workstation designed to download videos (MP4 up to 4K) and extract high-bitrate audio (MP3 up to 320 kbps) directly to your local storage.

## Features

- **Direct Local Storage**: Connects directly to local folders using the browser's native File System Access API (`showDirectoryPicker`) for instant file saving.
- **Video & Audio Presets**:
  - **Video (MP4)**: Best available (up to 4K/2160p), 1080p Full HD, 720p HD, 480p, 360p.
  - **Audio (MP3 / M4A / FLAC / WAV)**: High fidelity 320 kbps, 256 kbps, 192 kbps, 128 kbps.
- **Batch Download Queue**: Import multiple URLs simultaneously with uniform quality and format presets.
- **Multi-Stream Performance**:
  - Parallel chunk fragmentation (4x, 8x, 16x fragment streams).
  - Configurable concurrency limit (1 to 8 concurrent active downloads).
  - Turbo Mode for high-throughput buffer allocation.
- **Queue Controls**: Pause, Resume, Retry, Cancel, Clear Completed, and in-app media player preview.

---

## Quick Start

### Windows

1. Extract the project folder.
2. Double-click **`Ripcord.exe`** (or `run.bat`).
3. The launcher will automatically start the server and open **http://localhost:3000** in your browser.

*(Requires [Node.js](https://nodejs.org/) v18 or newer installed on your machine).*

### macOS & Linux

```bash
# Clone the repository
git clone https://github.com/shloky-11/ripcord.git
cd ripcord

# Install dependencies and start
npm install
npm run dev
```

Or execute `./start.sh` directly. Open **http://localhost:3000** in your browser.

---

## Technical Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons
- **Backend Server**: Node.js, Express, Vite middleware integration
- **Download Core**: yt-dlp binary with FFmpeg media stream processing
- **Persistence**: Atomic JSON database (`ripcord-db.json`) with safe recovery

---

## License

MIT License. Open-source software for personal media archiving.
