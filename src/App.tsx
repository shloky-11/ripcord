import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  FolderDown, 
  FolderCheck, 
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { QueueItem, SystemStats, EngineSettings, MediaFormat, VideoQuality, AudioQuality, AudioCodec } from './types';
import { api } from './services/api';
import { localFolderService } from './services/localFolderService';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AddDownloadBar } from './components/AddDownloadBar';
import { QueueItemCard } from './components/QueueItemCard';
import { BatchModal } from './components/BatchModal';
import { PlaylistModal } from './components/PlaylistModal';
import { SettingsModal } from './components/SettingsModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { FolderManagerModal } from './components/FolderManagerModal';

type FilterTab = 'all' | 'downloading' | 'queued' | 'completed' | 'paused' | 'error';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ripcord_theme') !== 'light';
    }
    return true;
  });

  // System & Queue state
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    activeDownloads: 0,
    queuedCount: 0,
    completedCount: 0,
    failedCount: 0,
    totalSpeedBytesPerSec: 0,
    totalSpeedFormatted: '0.0 MB/s',
    totalDownloadedBytes: 0,
    totalDownloadedFormatted: '0 B',
    ytDlpAvailable: true,
    ffmpegAvailable: true,
  });

  const [settings, setSettings] = useState<EngineSettings>({
    maxConcurrent: 3,
    concurrentFragments: 8,
    turboMode: true,
    autoSaveToFolder: true,
    defaultFormat: 'video',
    defaultVideoQuality: '1080p',
    defaultAudioQuality: '320k',
    defaultAudioCodec: 'mp3',
    cookies: '',
    proxyUrl: '',
  });

  const [systemInfo, setSystemInfo] = useState({
    ytDlpAvailable: true,
    ffmpegAvailable: true,
    ytDlpVersion: '2026.10.26',
    defaultFolder: './downloads',
  });

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folderName, setFolderName] = useState(localFolderService.getFolderName());
  const [hasSelectedFolder, setHasSelectedFolder] = useState(localFolderService.hasSelectedDirectory());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistInitialUrl, setPlaylistInitialUrl] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);

  // Keep track of which items have been auto-saved to avoid duplicate saves
  const [autoSavedIds, setAutoSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ripcord_saved_ids');
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
  });

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Sync theme with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ripcord_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ripcord_theme', 'light');
    }
  }, [darkMode]);

  // Load initial settings and system info
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getSystemInfo().then(setSystemInfo).catch(console.error);
    setFolderName(localFolderService.getFolderName());
    setHasSelectedFolder(localFolderService.hasSelectedDirectory());
  }, []);

  // Version-aware queue state tracking to prevent unnecessary re-renders
  const lastQueueVersionRef = useRef<number | undefined>(undefined);
  const isFetchingRef = useRef(false);

  // Poll queue and stats with overlap guard
  const fetchQueueState = useCallback(async () => {
    if (isFetchingRef.current) return; // Prevent concurrent/overlapping requests
    isFetchingRef.current = true;

    try {
      const data = await api.getQueue(lastQueueVersionRef.current);
      if (data.unchanged) {
        return; // Backend confirmed queue has not changed; skip re-rendering
      }
      if (data.version !== undefined) {
        lastQueueVersionRef.current = data.version;
      }

      if (data.items) {
        setItems((prevItems) => {
          if (prevItems.length === data.items!.length) {
            let hasChanged = false;
            for (let i = 0; i < prevItems.length; i++) {
              const p = prevItems[i];
              const n = data.items![i];
              if (
                p.id !== n.id ||
                p.status !== n.status ||
                p.progress !== n.progress ||
                p.speed !== n.speed ||
                p.eta !== n.eta ||
                p.fileSize !== n.fileSize ||
                p.savedToLocalFolder !== n.savedToLocalFolder ||
                p.error !== n.error
              ) {
                hasChanged = true;
                break;
              }
            }
            if (!hasChanged) return prevItems; // Preserves reference -> zero re-render
          }
          return data.items!;
        });

        // Auto-save completed items to local folder if configured
        if (settings.autoSaveToFolder) {
          for (const item of data.items) {
            if (
              item.status === 'completed' &&
              !item.savedToLocalFolder &&
              !autoSavedIds.has(item.id) &&
              item.fileName
            ) {
              setAutoSavedIds((prev) => {
                const updated = new Set(prev).add(item.id);
                try {
                  localStorage.setItem('ripcord_saved_ids', JSON.stringify(Array.from(updated)));
                } catch {}
                return updated;
              });
              const downloadUrl = api.getDownloadUrl(item.id);
              localFolderService.saveFileToFolder(item.fileName, downloadUrl)
                .then((res) => {
                  if (res.success) {
                    api.markSavedToFolder(item.id).catch(console.error);
                    showToast(`Saved "${item.title.slice(0, 30)}..." to ${folderName}`);
                  }
                })
                .catch(console.error);
            }
          }
        }
      }

      if (data.stats) {
        setStats((prev) => {
          if (
            prev.activeDownloads === data.stats!.activeDownloads &&
            prev.queuedCount === data.stats!.queuedCount &&
            prev.completedCount === data.stats!.completedCount &&
            prev.failedCount === data.stats!.failedCount &&
            prev.totalSpeedBytesPerSec === data.stats!.totalSpeedBytesPerSec &&
            prev.totalDownloadedBytes === data.stats!.totalDownloadedBytes &&
            prev.ytDlpAvailable === data.stats!.ytDlpAvailable &&
            prev.ffmpegAvailable === data.stats!.ffmpegAvailable
          ) {
            return prev; // Preserves reference -> zero re-render
          }
          return data.stats!;
        });
      }
    } catch (err) {
      console.warn('Queue poll error:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [settings.autoSaveToFolder, autoSavedIds, folderName, showToast]);

  // Server-Sent Events (SSE) live push stream with automatic fallback to polling
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/queue/stream');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.version !== undefined && payload.version !== lastQueueVersionRef.current) {
            fetchQueueState();
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (es) es.close();
    };
  }, [fetchQueueState]);

  // Non-overlapping fallback polling: 1500ms active (1-2s range), 4000ms idle (3-5s range)
  useEffect(() => {
    fetchQueueState();
    const intervalTime = stats.activeDownloads > 0 ? 1500 : 4000;
    const timer = setInterval(fetchQueueState, intervalTime);
    return () => clearInterval(timer);
  }, [fetchQueueState, stats.activeDownloads]);

  // Handlers for Queue Actions
  const handleAddDownload = async (params: {
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }) => {
    try {
      setIsSubmitting(true);
      await api.addToQueue(params);
      showToast(`Added to download queue`);
      await fetchQueueState();
    } catch (err: any) {
      showToast(err.message || 'Failed to add download');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchAdd = async (batchItems: Array<{
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }>) => {
    try {
      const res = await api.batchAddToQueue(batchItems);
      showToast(`Queued ${res.items.length} items`);
      await fetchQueueState();
    } catch (err: any) {
      showToast(err.message || 'Batch failed');
      throw err;
    }
  };

  const handleOpenPlaylistModal = useCallback((initialUrl = '') => {
    setPlaylistInitialUrl(initialUrl);
    setIsPlaylistModalOpen(true);
  }, []);

  const handleQueuePlaylist = async (params: {
    playlistId?: string;
    playlistTitle?: string;
    items: Array<{
      url: string;
      title: string;
      author?: string;
      thumbnail?: string;
      duration?: string;
    }>;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }) => {
    try {
      const res = await api.queuePlaylistItems(params);
      showToast(`Queued ${res.items.length} tracks from "${params.playlistTitle || 'Playlist'}"`);
      await fetchQueueState();
    } catch (err: any) {
      showToast(err.message || 'Failed to queue playlist');
      throw err;
    }
  };

  const handleAddSampleBatch = async () => {
    try {
      const res = await api.addSampleBatch();
      showToast(`Loaded ${res.items.length} high-speed test streams`);
      await fetchQueueState();
    } catch (err: any) {
      showToast('Failed to add sample batch');
    }
  };

  const handlePause = async (id: string) => {
    await api.pauseItem(id);
    await fetchQueueState();
  };

  const handleResume = async (id: string) => {
    await api.resumeItem(id);
    await fetchQueueState();
  };

  const handleCancel = async (id: string) => {
    await api.cancelItem(id);
    await fetchQueueState();
  };

  const handleRetry = async (id: string) => {
    await api.retryItem(id);
    await fetchQueueState();
  };

  const handleDelete = async (id: string) => {
    await api.deleteItem(id);
    await fetchQueueState();
  };

  const handlePauseAll = async () => {
    await api.pauseAll();
    showToast('Paused all active downloads');
    await fetchQueueState();
  };

  const handleResumeAll = async () => {
    await api.resumeAll();
    showToast('Resumed queued downloads');
    await fetchQueueState();
  };

  const handleClearCompleted = async () => {
    await api.clearCompleted();
    showToast('Cleared completed items from queue');
    await fetchQueueState();
  };

  const handleSaveToFolder = async (item: QueueItem) => {
    if (!item.fileName) return;
    const downloadUrl = api.getDownloadUrl(item.id);
    const res = await localFolderService.saveFileToFolder(item.fileName, downloadUrl);
    if (res.success) {
      showToast(`Saved "${item.fileName}" to ${res.savedPath || folderName}`);
    } else {
      showToast(res.error || 'Failed to save file');
    }
  };

  const handleSelectFolder = async () => {
    const res = await localFolderService.selectFolder();
    if (res.success && res.name) {
      setFolderName(res.name);
      setHasSelectedFolder(true);
      showToast(`Selected destination folder: ${res.name}`);
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<EngineSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
    showToast('Engine speed and settings updated');
  };

  // Single-pass computation for tab counts and filtered queue items
  const { tabCounts, filteredItems } = useMemo(() => {
    const counts = { all: items.length, downloading: 0, queued: 0, completed: 0, paused: 0, error: 0 };
    const query = searchQuery.trim().toLowerCase();
    const result: QueueItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const status = item.status;
      if (status === 'downloading' || status === 'processing') counts.downloading++;
      else if (status === 'queued') counts.queued++;
      else if (status === 'completed') counts.completed++;
      else if (status === 'paused') counts.paused++;
      else if (status === 'error') counts.error++;

      let matchesFilter = true;
      if (activeFilter === 'downloading') {
        matchesFilter = (status === 'downloading' || status === 'processing');
      } else if (activeFilter !== 'all') {
        matchesFilter = (status === activeFilter);
      }

      if (matchesFilter) {
        if (!query) {
          result.push(item);
        } else {
          const matches =
            item.title.toLowerCase().includes(query) ||
            item.author.toLowerCase().includes(query) ||
            item.url.toLowerCase().includes(query);
          if (matches) result.push(item);
        }
      }
    }

    return { tabCounts: counts, filteredItems: result };
  }, [items, activeFilter, searchQuery]);

  // Pagination to cap DOM nodes and avoid rendering large lists simultaneously
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Bar Navigation */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        folderName={folderName}
        hasSelectedFolder={hasSelectedFolder}
        onOpenFolderManager={() => setIsFolderManagerOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenPlaylistModal={() => handleOpenPlaylistModal()}
        settings={settings}
        onToast={showToast}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Metric KPI Strip */}
        <StatsBar stats={stats} maxConcurrent={settings.maxConcurrent} />

        {/* Primary Input & Configuration Bar */}
        <AddDownloadBar
          onAdd={handleAddDownload}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenPlaylistModal={handleOpenPlaylistModal}
          onAddSampleBatch={handleAddSampleBatch}
          isSubmitting={isSubmitting}
        />

        {/* Queue Management Dashboard */}
        <section className="flex flex-col gap-3">
          {/* Dashboard Controls: Filters & Bulk Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-x-auto text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <span>All</span>
                <span className="font-mono tabular-nums opacity-75">({tabCounts.all})</span>
              </button>

              <button
                onClick={() => setActiveFilter('downloading')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === 'downloading'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <span>Downloading</span>
                <span className="font-mono tabular-nums opacity-75">({tabCounts.downloading})</span>
              </button>

              <button
                onClick={() => setActiveFilter('queued')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === 'queued'
                    ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <span>Queued</span>
                <span className="font-mono tabular-nums opacity-75">({tabCounts.queued})</span>
              </button>

              <button
                onClick={() => setActiveFilter('completed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <span>Completed</span>
                <span className="font-mono tabular-nums opacity-75">({tabCounts.completed})</span>
              </button>

              {tabCounts.paused > 0 && (
                <button
                  onClick={() => setActiveFilter('paused')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeFilter === 'paused'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <span>Paused</span>
                  <span className="font-mono tabular-nums opacity-75">({tabCounts.paused})</span>
                </button>
              )}

              {tabCounts.error > 0 && (
                <button
                  onClick={() => setActiveFilter('error')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeFilter === 'error'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <span>Failed</span>
                  <span className="font-mono tabular-nums opacity-75">({tabCounts.error})</span>
                </button>
              )}
            </div>

            {/* Right Tools: Live Search & Queue Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search queue..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
              </div>

              {stats.activeDownloads > 0 ? (
                <button
                  onClick={handlePauseAll}
                  title="Pause all in-flight downloads"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause All</span>
                </button>
              ) : (
                <button
                  onClick={handleResumeAll}
                  title="Resume all queued/paused downloads"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resume All</span>
                </button>
              )}

              {tabCounts.completed > 0 && (
                <button
                  onClick={handleClearCompleted}
                  title="Clear completed downloads from queue"
                  className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Queue List / High-Density Grid */}
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {paginatedItems.map((item) => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  onSaveToLocalFolder={handleSaveToFolder}
                  onPreview={(it) => setPreviewItem(it)}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                  folderName={folderName}
                />
              ))}

              {/* Pagination Controls when queue exceeds page size */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 pb-1 px-1 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                  <span>
                    Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} items
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="px-2 font-mono tabular-nums text-neutral-700 dark:text-neutral-300 font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Download className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {searchQuery ? 'No matching downloads found' : 'Your download queue is empty'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {searchQuery 
                    ? `No items match "${searchQuery}". Clear your search query to see all items.`
                    : 'Paste any YouTube link above, batch import multiple URLs, or run the Quick Test Batch to see concurrent multi-stream downloads in action.'}
                </p>
              </div>

              {!searchQuery && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleAddSampleBatch}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Quick Test Batch (3 Streams)</span>
                  </button>

                  <button
                    onClick={() => setIsBatchModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Paste Multi-URL Batch
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FolderCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchAdd={handleBatchAdd}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        initialUrl={playlistInitialUrl}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setPlaylistInitialUrl('');
        }}
        onQueuePlaylist={handleQueuePlaylist}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        systemInfo={systemInfo}
      />

      <MediaPlayerModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onSaveToFolder={handleSaveToFolder}
        folderName={folderName}
      />

      <FolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        folderName={folderName}
        hasSelectedFolder={hasSelectedFolder}
        onSelectFolder={handleSelectFolder}
        isFsSupported={localFolderService.getIsSupported()}
        autoSaveToFolder={settings.autoSaveToFolder}
        onToggleAutoSave={(val) => handleSaveSettings({ autoSaveToFolder: val })}
      />
    </div>
  );
}
