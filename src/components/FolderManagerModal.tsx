import { X, FolderDown, HardDrive, Check, Info, FolderOpen, ArrowRight } from 'lucide-react';

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  hasSelectedFolder: boolean;
  onSelectFolder: () => Promise<void>;
  isFsSupported: boolean;
  autoSaveToFolder: boolean;
  onToggleAutoSave: (val: boolean) => void;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  isOpen,
  onClose,
  folderName,
  hasSelectedFolder,
  onSelectFolder,
  isFsSupported,
  autoSaveToFolder,
  onToggleAutoSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FolderDown className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Local Storage Folder Destination
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Active Folder Card */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-neutral-500 block">Current Target Directory</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {folderName}
                  </span>
                </div>
              </div>

              {hasSelectedFolder && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                  <Check className="w-3 h-3" /> Direct Access
                </span>
              )}
            </div>

            <button
              onClick={onSelectFolder}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>{hasSelectedFolder ? 'Change Local Folder' : 'Select Destination Folder on Your Computer'}</span>
            </button>
          </div>

          {/* Direct File System Access API Info */}
          <div className="flex flex-col gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" /> How Local Folder Saving Works
            </span>
            <p>
              Ripcord uses the browser’s native <strong>File System Access API</strong> to write downloaded videos and audio files directly to the directory you choose on your computer (e.g. <code className="font-mono">~/Downloads/YouTube</code>, <code className="font-mono">D:\Media\Music</code>).
            </p>
            <p>
              Once granted, downloaded files stream seamlessly into that exact directory without extra prompts.
            </p>
          </div>

          {/* Auto-Save Toggle */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
            <div className="flex flex-col pr-4">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Auto-Save Upon Completion
              </span>
              <span className="text-[11px] text-neutral-500">
                Automatically writes files to your chosen folder as soon as downloads finish.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoSaveToFolder}
              onChange={(e) => onToggleAutoSave(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {!isFsSupported && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              Your browser uses standard automatic downloads. Files will be saved into your operating system's default Downloads directory.
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
