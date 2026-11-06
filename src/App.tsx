import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  FolderDown, 
  FolderCheck, 
  Sparkles, 
  Download,
  AlertCircle
} from 'lucide-react';
import { QueueItem, SystemStats, EngineSettings, MediaFormat, VideoQuality, AudioQuality, AudioCodec } from './types';
import { api } from './services/api';
import { localFolderService } from './services/localFolderService';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AddDownloadBar } from './components/AddDownloadBar';
import { QueueItemCard } from './components/QueueItemCard';
import { BatchModal } from './components/BatchModal';
import { SettingsModal } from './components/SettingsModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { FolderManagerModal } from './components/FolderManagerModal';

type FilterTab = 'all' | 'downloading' | 'queued' | 'completed' | 'paused' | 'error';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pulsetube_theme') !== 'light';
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);

  // Keep track of which items have been auto-saved to avoid duplicate saves
  const [autoSavedIds, setAutoSavedIds] = useState<Set<string>>(new Set());

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
      localStorage.setItem('pulsetube_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pulsetube_theme', 'light');
    }
  }, [darkMode]);

  // Load initial settings and system info
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getSystemInfo().then(setSystemInfo).catch(console.error);
    setFolderName(localFolderService.getFolderName());
    setHasSelectedFolder(localFolderService.hasSelectedDirectory());
  }, []);

  // Poll queue and stats
  const fetchQueueState = useCallback(async () => {
    try {
      const data = await api.getQueue();
      setItems(data.items);
      setStats(data.stats);

      // Auto-save completed items to local folder if configured
      if (settings.autoSaveToFolder) {
        for (const item of data.items) {
          if (item.status === 'completed' && !autoSavedIds.has(item.id) && item.fileName) {
            setAutoSavedIds((prev) => new Set(prev).add(item.id));
            const downloadUrl = api.getDownloadUrl(item.id);
            localFolderService.saveFileToFolder(item.fileName, downloadUrl)
              .then((res) => {
                if (res.success) {
                  showToast(`Saved "${item.title.slice(0, 30)}..." to ${folderName}`);
                }
              })
              .catch(console.error);
          }
        }
      }
    } catch (err) {
      console.warn('Queue poll error:', err);
    }
  }, [settings.autoSaveToFolder, autoSavedIds, folderName, showToast]);

  useEffect(() => {
    fetchQueueState();
    const intervalTime = stats.activeDownloads > 0 ? 500 : 1500;
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
      const res = await api.addToQueue(params);
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

  const handleAddSampleBatch = async () => {
    try {
      await api.addSampleBatch();
      showToast('Added 3 sample media streams to queue');
      await fetchQueueState();
    } catch (err: any) {
      showToast(err.message || 'Failed to add sample batch');
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
    showToast('All downloads paused');
    await fetchQueueState();
  };

  const handleResumeAll = async () => {
    await api.resumeAll();
    showToast('All downloads resumed');
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

  const handleSaveAllCompletedToFolder = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.fileName);
    if (completedItems.length === 0) return;

    let savedCount = 0;
    for (const item of completedItems) {
      const downloadUrl = api.getDownloadUrl(item.id);
      const res = await localFolderService.saveFileToFolder(item.fileName!, downloadUrl);
      if (res.success) savedCount++;
    }
    showToast(`Saved ${savedCount} completed files to ${folderName}`);
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

  // Filtered Queue Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by status tab
      if (activeFilter === 'downloading' && item.status !== 'downloading' && item.status !== 'processing') return false;
      if (activeFilter === 'queued' && item.status !== 'queued') return false;
      if (activeFilter === 'completed' && item.status !== 'completed') return false;
      if (activeFilter === 'paused' && item.status !== 'paused') return false;
      if (activeFilter === 'error' && item.status !== 'error') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesAuthor = item.author.toLowerCase().includes(query);
        const matchesUrl = item.url.toLowerCase().includes(query);
        return matchesTitle || matchesAuthor || matchesUrl;
      }

      return true;
    });
  }, [items, activeFilter, searchQuery]);

  // Tab counts for clean segmented control
  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      downloading: items.filter((i) => i.status === 'downloading' || i.status === 'processing').length,
      queued: items.filter((i) => i.status === 'queued').length,
      completed: items.filter((i) => i.status === 'completed').length,
      paused: items.filter((i) => i.status === 'paused').length,
      error: items.filter((i) => i.status === 'error').length,
    };
  }, [items]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Bar Contract */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        folderName={folderName}
        hasSelectedFolder={hasSelectedFolder}
        onOpenFolderManager={() => setIsFolderManagerOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
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
                  placeholder="Filter queue..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden"
                />
              </div>

              {/* Bulk Actions */}
              {tabCounts.downloading > 0 ? (
                <button
                  onClick={handlePauseAll}
                  title="Pause all active downloads"
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause All</span>
                </button>
              ) : tabCounts.paused > 0 ? (
                <button
                  onClick={handleResumeAll}
                  title="Resume all paused downloads"
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Resume All</span>
                </button>
              ) : null}

              {tabCounts.completed > 0 && (
                <>
                  <button
                    onClick={handleSaveAllCompletedToFolder}
                    title={`Save all ${tabCounts.completed} completed files to local folder`}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                  >
                    <FolderDown className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Save All</span>
                  </button>

                  <button
                    onClick={handleClearCompleted}
                    title="Clear completed downloads from queue"
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Queue List / High-Density Grid */}
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {filteredItems.map((item) => (
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
                  folderName={folderName}
                />
              ))}
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
                    <Sparkles className="w-3.5 h-3.5" />
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
