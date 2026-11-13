import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Layers, 
  Key, 
  Check, 
  HelpCircle, 
  HardDrive, 
  Cpu, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { EngineSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSave: (newSettings: Partial<EngineSettings>) => Promise<void>;
  systemInfo: {
    ytDlpAvailable: boolean;
    ffmpegAvailable: boolean;
    ytDlpVersion: string;
    defaultFolder: string;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  systemInfo,
}) => {
  const [formData, setFormData] = useState<EngineSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCookieHelp, setShowCookieHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Maximum Speed & Engine Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Section 1: Concurrency & Max Speed */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Speed & Parallel Concurrency</span>
            </div>

            {/* Concurrent Downloads Slider */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Concurrent Downloads Limit
                </label>
                <span className="font-mono tabular-nums text-xs font-bold text-blue-600 dark:text-blue-400">
                  {formData.maxConcurrent} active streams
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={formData.maxConcurrent}
                onChange={(e) => setFormData({ ...formData, maxConcurrent: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Number of queued videos or audio files to download simultaneously (1–4 streams).
              </span>
            </div>

            {/* Chunk Fragmentation & Turbo Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Multi-Stream Fragments
                </label>
                <select
                  value={formData.concurrentFragments}
                  onChange={(e) => setFormData({ ...formData, concurrentFragments: parseInt(e.target.value, 10) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                >
                  <option value={1}>1x Single Stream (Minimal memory & socket use)</option>
                  <option value={2}>2x Parallel Fragments (Recommended balance)</option>
                  <option value={4}>4x Parallel Fragments (High Throughput)</option>
                </select>
                <span className="text-[11px] text-neutral-500">
                  Splits each file into chunk streams without socket exhaustion.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" /> Turbo Boost Mode
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.turboMode}
                      onChange={(e) => setFormData({ ...formData, turboMode: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Enables aggressive buffer pools, HTTP chunking, and ultrafast ffmpeg remuxing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: YouTube Cookies & Authentication */}
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span>YouTube Authentication / Cookies</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieHelp(!showCookieHelp)}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Why add cookies?</span>
              </button>
            </div>

            {showCookieHelp && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex flex-col gap-1">
                <p>
                  <strong>Notice:</strong> YouTube blocks cloud server IPs with "Sign in to confirm you're not a bot" unless you supply your YouTube session cookies.
                </p>
                <p>
                  You can export cookies from YouTube in your browser using an extension like <strong>Get cookies.txt LOCALLY</strong> (Netscape format) or <strong>Cookie-Editor</strong> (JSON export), and paste them below.
                </p>
              </div>
            )}

            <textarea
              rows={3}
              value={formData.cookies}
              onChange={(e) => setFormData({ ...formData, cookies: e.target.value })}
              placeholder="Paste Netscape cookies.txt, JSON cookie export, or raw Cookie header string here..."
              className="w-full p-2.5 font-mono text-[11px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Section 3: System Diagnostics */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs flex flex-col gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Engine System Diagnostics
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>yt-dlp: {systemInfo.ytDlpAvailable ? `Installed (${systemInfo.ytDlpVersion})` : 'Not detected'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>ffmpeg: {systemInfo.ffmpegAvailable ? 'Installed (v4.4.2)' : 'Not detected'}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 truncate">
                <HardDrive className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Storage Directory: {systemInfo.defaultFolder}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? 'Saved' : 'Save Engine Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
