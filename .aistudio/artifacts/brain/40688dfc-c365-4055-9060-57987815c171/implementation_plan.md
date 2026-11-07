# PulseTube - Windows 11 Desktop Migration

A transformation of the PulseTube web downloader into a native Windows 11 desktop application experience, featuring a Fluent 2 acrylic window frame with interactive title bar controls, Windows Snap layouts, Windows File Explorer path integration, a desktop system tray manager, and downloadable native Windows batch/PowerShell runtimes.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed through interactive clarification and will guide the implementation:

- **Confirmed Decision 1 (Window Structure)**: Migrate the interface into an authentic Windows 11 desktop window container with title bar, window management states (minimize, maximize/restore, close to tray), and seamless full-screen canvas controls.
- **Confirmed Decision 2 (Fluent 2 Aesthetic)**: Implement Windows 11 Mica and Acrylic material translucency, subtle border radius (12px window corners), Segoe UI / Plus Jakarta Sans typography, and native Windows command bars.
- **Confirmed Decision 3 (Windows System Integrations)**:
  - **Windows File Explorer Bridge**: Add native-style Windows directory path selector (`C:\Users\...\Downloads\PulseTube`), with quick actions to "Open in Windows Explorer" (`explorer.exe`) and "Copy Windows Path".
  - **Windows System Tray & Notification Flyout**: Interactive tray icon in the corner with mini-playback controller, pause/resume all toggles, speed indicator, and Windows Action Center toast notifications.
  - **Windows Export & Launcher Scripts**: Interactive "Export for Windows" modal with ready-to-run Windows launcher batch files (`run.bat`, `start.ps1`, `setup-windows.cmd`) bundling portable `yt-dlp.exe` and `ffmpeg.exe` configurations.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms PulseTube from a generic web page into a high-performance Windows 11 desktop workstation app. Users can download 4K videos, extract 320kbps MP3s, manage batch queues, inspect downloads in a Windows File Explorer view, minimize the window to a system tray, and package the app directly for offline Windows execution.
- **Target Audience / Persona**: Windows users, content creators, audio archivists, and offline media enthusiasts seeking a modern Windows 11 utility without intrusive ads or bloatware.
- **Key Value**: Delivers the tactile feel, keyboard shortcuts, window controls, and file management ergonomics of a flagship Windows 11 utility, fully functional both in-browser and exportable to Windows PC.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Window Management & Snap Layouts**:
   - The top of the application displays an authentic Windows 11 title bar with the application icon, window title, search/address pill, and window controls (Minimize, Maximize/Restore, Close).
   - Hovering over the Maximize button reveals an interactive Windows 11 **Snap Layouts** flyout (2-column 50/50, 60/40, 3-column, or 4-corner grid presets) that resizes and positions the window canvas dynamically.
2. **Windows File Explorer Experience**:
   - A dedicated "Downloads Folder" bar displays Windows-style paths (e.g. `C:\Users\Default\Downloads\PulseTube`).
   - Each completed download item features an "Open in Explorer" button that reveals file details in a Windows Explorer dialog overlay, complete with file size, metadata tags, and quick playback.
3. **Windows System Tray**:
   - A tray button in the corner exposes a simulated Windows 11 taskbar tray flyout with active download speed, task count, one-click pause/resume, and quick launch.
4. **Export for Windows**:
   - An "Export Windows Bundle" dialog generates clean, production-ready `.bat` and `.ps1` scripts, environment files, and an executable download guide to run natively on any Windows 10/11 system.

### Visual Identity & Theme
- **Aesthetic Direction**: Windows 11 Fluent Design (Fluent 2) with Mica/Acrylic translucency, 12px outer radius, and crisp 1px borders (`rgba(255, 255, 255, 0.08)` dark, `rgba(0, 0, 0, 0.06)` light).
- **Color Palette & Mood**:
  - *Dark Canvas*: Windows 11 Mica Dark (`#202020` / `#181818`), taskbar elevated surfaces (`#2C2C2C`), acrylic floating flyouts (`#252525` with `backdrop-blur-xl`).
  - *Accent*: Windows 11 Cobalt Accent (`#0078D4` / `#005FB8` on light, `#60CDFF` on dark).
  - *Light Canvas*: Windows 11 Mica Light (`#F3F3F3`), cards (`#FFFFFF`), borders (`#E5E5E5`).
- **Typography**: `Plus Jakarta Sans` display paired with `JetBrains Mono` for tabular metrics, file paths, and speed rates (`tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Windows Window Shell Simulation in Web Runtime**:
  - *Chosen Approach*: Implement a fully reactive Windows 11 window container with draggable-feel header, minimize to tray, maximize/restore toggling, snap layouts preview, and custom title bar controls.
  - *Why*: Provides the authentic Windows desktop experience directly in the AI Studio web preview, while remaining 100% responsive and accessible.
- **Decision 2: Realistic Windows File Explorer Dialogue & Path Management**:
  - *Chosen Approach*: Provide a Windows File Explorer overlay modal with standard Windows navigation pane (Quick Access, Downloads, This PC) alongside the modern HTML5 File System Access API for real local disk folders.
  - *Why*: Gives users both the visual familiar comfort of Windows File Explorer and real disk synchronization.
- **Decision 3: Standalone Windows Packaging Suite**:
  - *Chosen Approach*: Provide structured, downloadable Windows batch (`.bat`) and PowerShell (`.ps1`) scripts in the app that bundle automated `yt-dlp.exe` and `ffmpeg.exe` bootstrap routines.
  - *Why*: Allows users to run the exact same application as a native local Windows background service and app on their Windows machines.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   WINDOWS 11 DESKTOP SHELL CONTAINER                   │
├────────────────────────────────────────────────────────────────────────┤
│  [Icon] PulseTube - Video & Audio Workstation    [🗕]  [🗖 Snap]  [🗙]   │
├────────────────────────────────────────────────────────────────────────┤
│  Windows Command Bar: [➕ Add URL] [📁 Explorer] [⚡ Turbo] [⚙ Settings] │
├───────────────────────────────┬────────────────────────────────────────┤
│  QUICK ACCESS / QUEUE FILTERS │  ACTIVE DOWNLOADS & STREAM ENGINE      │
│  • All Downloads              │  • URL Input & Format Dropdowns        │
│  • Downloading (Active)       │  • High-Speed Progress & Fragments     │
│  • Completed                  │  • Card Grid with Fluent Styling       │
│  • Audio / MP3 Extracts       │  • "Open in Explorer" Quick Actions    │
├───────────────────────────────┴────────────────────────────────────────┤
│  WINDOWS TASKBAR / TRAY: [Tray Flyout 4.2 MB/s] [Path: C:\...\Downloads]│
└────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
- `src/components/windows/WindowsTitleBar.tsx`: Window controls, maximize/restore, snap layout picker, title.
- `src/components/windows/WindowsSnapPicker.tsx`: Windows 11 hover snap layout selector (2x1, 1x2, 2x2, 3 columns).
- `src/components/windows/WindowsFileExplorerModal.tsx`: Simulated Explorer dialog showing downloads, file size, extensions, and open/reveal actions.
- `src/components/windows/WindowsTrayFlyout.tsx`: System tray flyout with quick pause/resume all, speed charts, and minimize restore.
- `src/components/windows/WindowsExportModal.tsx`: One-click copy/download of Windows batch and PowerShell launcher scripts.
- `src/App.tsx`: Main container orchestrating window state, snap layout sizing, and existing queue operations.
