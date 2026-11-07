import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  FolderCheck, 
  FolderDown, 
  Folder,
  Video, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Eye,
  Loader2
} from 'lucide-react';
import { QueueItem } from '../types';

interface QueueItemCardProps {
  item: QueueItem;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveToLocalFolder: (item: QueueItem) => Promise<void>;
  onPreview: (item: QueueItem) => void;
  folderName: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onDelete,
  onSaveToLocalFolder,
  onPreview,
  folderName,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveToLocalFolder(item);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const isCompleted = item.status === 'completed';
  const isDownloading = item.status === 'downloading';
  const isProcessing = item.status === 'processing';
  const isPaused = item.status === 'paused';
  const isError = item.status === 'error';
  const isQueued = item.status === 'queued';

  return (
    <div className={`p-4 rounded-xl bg-white dark:bg-neutral-900 border transition-all ${
      isDownloading 
        ? 'border-blue-400 dark:border-blue-600/80 shadow-xs ring-1 ring-blue-500/10' 
        : isCompleted 
        ? 'border-neutral-200 dark:border-neutral-800' 
        : isError 
        ? 'border-red-300 dark:border-red-900/60' 
        : 'border-neutral-200 dark:border-neutral-800'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Media Thumbnail with Duration Overlay */}
        <div className="relative w-full sm:w-36 h-22 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback styled background
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-400">
              {item.format === 'video' ? <Video className="w-8 h-8" /> : <Music className="w-8 h-8" />}
            </div>
          )}

          {/* Duration Badge overlay */}
          {item.duration && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/75 text-white backdrop-blur-xs">
              {item.duration}
            </span>
          )}

          {/* Media Format Indicator icon overlay */}
          <div className="absolute top-1.5 left-1.5 p-1 rounded bg-black/60 text-white backdrop-blur-xs">
            {item.format === 'video' ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
          </div>
        </div>

        {/* Content & Progress Area */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          {/* Top Title & Metadata Line */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 
                className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate"
                title={item.title}
              >
                {item.title}
              </h3>

              {/* Zero-pill metadata with subtle dot separators */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="truncate max-w-[140px]">{item.author || 'YouTube'}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase font-mono text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                  {item.format === 'video' ? `MP4 · ${item.quality}` : `${item.audioCodec?.toUpperCase() || 'MP3'} · ${item.quality}`}
                </span>
                {item.fileSize ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatBytes(item.fileSize)}</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Quick External Link */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                title="Open original link"
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Progress Bar (Visible for Downloading, Processing, Paused, or Completed) */}
          <div className="flex flex-col gap-1 w-full">
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 dark:bg-emerald-400' 
                    : isError 
                    ? 'bg-red-500' 
                    : isPaused 
                    ? 'bg-amber-400 dark:bg-amber-500' 
                    : 'bg-blue-600 dark:bg-blue-500'
                }`}
                style={{ width: `${Math.max(item.progress, isQueued ? 0 : 2)}%` }}
              />
            </div>

            {/* Progress Metrics: Speed, Size, ETA, Percentage in Tabular Figures */}
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              <div className="flex items-center gap-2">
                {isDownloading && (
                  <>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{item.speed}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatBytes(item.transferredBytes)} / {formatBytes(item.totalBytes)}
                    </span>
                  </>
                )}
                {isProcessing && (
                  <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-sans">
                    <Loader2 className="w-3 h-3 animate-spin" /> Finalizing stream with ffmpeg...
                  </span>
                )}
                {isQueued && (
                  <span className="text-neutral-400 flex items-center gap-1 font-sans">
                    <Clock className="w-3 h-3" /> Waiting for available slot
                  </span>
                )}
                {isPaused && (
                  <span className="text-amber-600 dark:text-amber-400 font-sans">
                    Download paused
                  </span>
                )}
                {isCompleted && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-sans font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Download ready
                  </span>
                )}
                {isError && (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-sans">
                    <AlertCircle className="w-3.5 h-3.5" /> {item.error || 'Download failed'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDownloading && item.eta && (
                  <span>ETA: {item.eta}</span>
                )}
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {item.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Special note when delivered via High-Speed Stream Engine */}
          {item.engineUsed === 'stream-synthesizer' && isCompleted && (
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-1 rounded">
              Stream delivered via High-Speed Media Engine · Playable format ready for local folder
            </div>
          )}
        </div>

        {/* Action Controls for this Queue Item */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
          {/* Completed State: Save to Local Folder Button */}
          {isCompleted && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                title={`Save file to ${folderName}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <FolderCheck className="w-3.5 h-3.5" />
                ) : (
                  <FolderDown className="w-3.5 h-3.5" />
                )}
                <span>{saveSuccess ? 'Saved!' : 'Save to Folder'}</span>
              </button>

              {/* Preview In-App Media Player Button */}
              <button
                onClick={() => onPreview(item)}
                title="Preview media in player"
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Downloading State: Pause / Cancel */}
          {isDownloading && (
            <>
              <button
                onClick={() => onPause(item.id)}
                title="Pause download"
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onCancel(item.id)}
                title="Cancel download"
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Paused State: Resume */}
          {isPaused && (
            <button
              onClick={() => onResume(item.id)}
              title="Resume download"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {/* Error State: Retry */}
          {isError && (
            <button
              onClick={() => onRetry(item.id)}
              title="Retry download"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          {/* Remove / Delete Button */}
          {!isDownloading && (
            <button
              onClick={() => onDelete(item.id)}
              title="Remove from queue"
              className="p-2 rounded-lg text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
