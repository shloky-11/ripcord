import React from 'react';
import { X, Video, Music, FolderDown, Download } from 'lucide-react';
import { QueueItem } from '../types';
import { api } from '../services/api';

interface MediaPlayerModalProps {
  item: QueueItem | null;
  onClose: () => void;
  onSaveToFolder: (item: QueueItem) => void;
  folderName: string;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  item,
  onClose,
  onSaveToFolder,
  folderName,
}) => {
  if (!item) return null;

  const streamUrl = api.getStreamUrl(item.id);
  const downloadUrl = api.getDownloadUrl(item.id);
  const isVideo = item.format === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              {isVideo ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {item.title}
              </h2>
              <p className="text-xs text-neutral-500 truncate">
                {item.author} · {item.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Player Body */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/5 dark:bg-black/40">
          {isVideo ? (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
              <video
                src={streamUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="w-full py-8 px-6 flex flex-col items-center justify-center gap-6 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-200/50 dark:from-neutral-800/80 dark:to-neutral-900/80 border border-neutral-200 dark:border-neutral-700">
              {/* Cover Art */}
              <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg bg-neutral-900 relative">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Music className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Native Audio Player */}
              <audio
                src={streamUrl}
                controls
                autoPlay
                className="w-full max-w-md accent-blue-600"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500">
            Playing directly from local storage engine
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveToFolder(item)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Save to {folderName}</span>
            </button>

            <a
              href={downloadUrl}
              download={item.fileName}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct Download</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
