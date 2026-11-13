import React from 'react';
import { 
  FolderDown, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Zap, 
  ListPlus, 
  ListVideo,
  DownloadCloud, 
  Share2 
} from 'lucide-react';
import { EngineSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  folderName: string;
  hasSelectedFolder: boolean;
  onOpenFolderManager: () => void;
  onOpenSettings: () => void;
  onOpenBatchModal: () => void;
  onOpenPlaylistModal: () => void;
  settings: EngineSettings;
  onToast?: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  folderName,
  hasSelectedFolder,
  onOpenFolderManager,
  onOpenSettings,
  onOpenBatchModal,
  onOpenPlaylistModal,
  settings,
  onToast,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm sticky top-0 z-30 transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <a href="/" title="Ripcord Home" className="flex items-center gap-3 shrink-0 group no-underline">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
          <svg className="w-4 h-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            Ripcord
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-none">
            High-Speed Video & Audio Downloader
          </span>
        </div>
      </a>

      {/* Zone 2: Navigation & Status Indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-300">
        {/* Local Folder Selector Button */}
        <button
          onClick={onOpenFolderManager}
          title="Change local destination folder"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap cursor-pointer"
        >
          <FolderDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span className="text-neutral-400 dark:text-neutral-500">Folder:</span>
          <span className="font-semibold max-w-[160px] truncate text-neutral-900 dark:text-neutral-100">
            {folderName}
          </span>
          {hasSelectedFolder && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              (Direct FS)
            </span>
          )}
        </button>

        {/* Turbo Mode Indicator */}
        {settings.turboMode && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold text-[11px]">Turbo Active ({settings.concurrentFragments}x Fragments)</span>
          </div>
        )}
      </div>

      {/* Zone 3: Primary Actions & Toggles */}
      <div className="flex items-center gap-2 shrink-0">
        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            title="Install as standalone web app"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        )}

        <button
          onClick={onOpenPlaylistModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ListVideo className="w-3.5 h-3.5" />
          Playlist
        </button>

        <button
          onClick={onOpenBatchModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ListPlus className="w-3.5 h-3.5" />
          Batch Add
        </button>

        <button
          onClick={onOpenSettings}
          title="Engine Settings & Maximum Speed Configuration"
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Dynamic Copy Session URL */}
        <button
          onClick={() => {
            if (navigator?.clipboard && typeof window !== 'undefined') {
              navigator.clipboard.writeText(window.location.origin);
              if (onToast) onToast('Copied app URL to clipboard!');
            }
          }}
          title="Copy current app URL"
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
