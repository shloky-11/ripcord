import React, { useState } from 'react';
import { 
  Plus, 
  Video, 
  Music, 
  Clipboard, 
  Sparkles, 
  ListPlus, 
  Loader2 
} from 'lucide-react';
import { MediaFormat, VideoQuality, AudioQuality, AudioCodec } from '../types';

interface AddDownloadBarProps {
  onAdd: (params: {
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }) => Promise<void>;
  onOpenBatchModal: () => void;
  onAddSampleBatch: () => Promise<void>;
  isSubmitting?: boolean;
}

export const AddDownloadBar: React.FC<AddDownloadBarProps> = ({
  onAdd,
  onOpenBatchModal,
  onAddSampleBatch,
  isSubmitting = false,
}) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<MediaFormat>('video');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('1080p');
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('320k');
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('mp3');
  const [isAddingSample, setIsAddingSample] = useState(false);
  const [inputError, setInputError] = useState('');

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setInputError('');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setInputError('Please enter a YouTube link');
      return;
    }

    try {
      setInputError('');
      await onAdd({
        url: url.trim(),
        format,
        quality: format === 'video' ? videoQuality : audioQuality,
        audioCodec: format === 'audio' ? audioCodec : undefined,
      });
      setUrl('');
    } catch (err: any) {
      setInputError(err.message || 'Failed to add URL');
    }
  };

  const handleSampleClick = async () => {
    try {
      setIsAddingSample(true);
      await onAddSampleBatch();
    } finally {
      setIsAddingSample(false);
    }
  };

  return (
    <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 shadow-xs transition-colors">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Top: URL Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="Paste YouTube link here (e.g. https://www.youtube.com/watch?v=... or youtu.be/...)"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
            />
            {/* Clipboard Paste Quick Button */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              title="Paste from clipboard"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Add to Queue</span>
          </button>
        </div>

        {inputError && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {inputError}
          </p>
        )}

        {/* Bottom Options Bar: Format Switcher & Quality Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format Segmented Selector */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setFormat('video')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  format === 'video'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video (MP4)
              </button>
              <button
                type="button"
                onClick={() => setFormat('audio')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  format === 'audio'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Audio Only (MP3)
              </button>
            </div>

            {/* Quality Dropdown based on chosen format */}
            {format === 'video' ? (
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-500 text-xs">Resolution:</span>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
                  className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="best">Best Available (up to 4K)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p Standard</option>
                  <option value="360p">360p Compact</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-500 text-xs">Bitrate:</span>
                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value as AudioQuality)}
                  className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="320k">320 kbps (High Fidelity)</option>
                  <option value="256k">256 kbps (Standard)</option>
                  <option value="192k">192 kbps (Medium)</option>
                  <option value="128k">128 kbps (Compact)</option>
                </select>

                <span className="text-neutral-500 text-xs">Codec:</span>
                <select
                  value={audioCodec}
                  onChange={(e) => setAudioCodec(e.target.value as AudioCodec)}
                  className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A (AAC)</option>
                  <option value="flac">FLAC (Lossless)</option>
                  <option value="wav">WAV</option>
                </select>
              </div>
            )}
          </div>

          {/* Quick Shortcuts: Batch Paste & Quick Test */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBatchModal}
              className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Multi-URL Batch</span>
            </button>
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              type="button"
              onClick={handleSampleClick}
              disabled={isAddingSample}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
            >
              {isAddingSample ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Quick Test Batch</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
