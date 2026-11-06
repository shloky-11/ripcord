import React, { useState } from 'react';
import { X, Video, Music, ListPlus, Loader2, Clipboard } from 'lucide-react';
import { MediaFormat, VideoQuality, AudioQuality, AudioCodec } from '../types';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAdd: (items: Array<{
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }>) => Promise<void>;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  onBatchAdd,
}) => {
  const [rawText, setRawText] = useState('');
  const [format, setFormat] = useState<MediaFormat>('video');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('1080p');
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('320k');
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('mp3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Extract valid URLs from text
  const urls = rawText
    .split(/[\r\n,]+/)
    .map(line => line.trim())
    .filter(line => line.length > 5 && (line.startsWith('http://') || line.startsWith('https://') || line.includes('youtu')));

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(prev => prev ? `${prev}\n${text.trim()}` : text.trim());
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleInsertSampleBatch = () => {
    const sampleUrls = [
      'https://www.youtube.com/watch?v=sample-lofi-beats-01',
      'https://www.youtube.com/watch?v=sample-nature-4k-02',
      'https://www.youtube.com/watch?v=sample-ambient-space-03',
      'https://www.youtube.com/watch?v=sample-coding-soundtrack-04',
    ];
    setRawText(sampleUrls.join('\n'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const items = urls.map(url => ({
        url,
        format,
        quality: format === 'video' ? videoQuality : audioQuality,
        audioCodec: format === 'audio' ? audioCodec : undefined,
      }));

      await onBatchAdd(items);
      setRawText('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Batch addition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Batch Download Queue
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Paste Multiple Links (one per line)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="w-3 h-3" /> Paste Clipboard
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={handleInsertSampleBatch}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Insert Sample Links
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError('');
              }}
              placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...\nhttps://youtu.be/...`}
              className="w-full p-3 font-mono text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>Detected URLs: <strong className="font-mono text-neutral-900 dark:text-neutral-100">{urls.length}</strong></span>
              <span>Supported: Standard YouTube, Shorts, Music</span>
            </div>
          </div>

          {/* Batch Options */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Apply Format to Entire Batch
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Format selection */}
              <div>
                <label className="text-neutral-500 block mb-1">Target Media</label>
                <div className="flex items-center p-0.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 border border-neutral-300/60 dark:border-neutral-600">
                  <button
                    type="button"
                    onClick={() => setFormat('video')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                      format === 'video'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('audio')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                      format === 'audio'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" /> Audio Only
                  </button>
                </div>
              </div>

              {/* Quality selection */}
              <div>
                <label className="text-neutral-500 block mb-1">
                  {format === 'video' ? 'Resolution' : 'Bitrate & Codec'}
                </label>
                {format === 'video' ? (
                  <select
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                  >
                    <option value="best">Best Available (4K / 2K)</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                    <option value="480p">480p</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={audioQuality}
                      onChange={(e) => setAudioQuality(e.target.value as AudioQuality)}
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                    >
                      <option value="320k">320 kbps</option>
                      <option value="256k">256 kbps</option>
                      <option value="192k">192 kbps</option>
                      <option value="128k">128 kbps</option>
                    </select>
                    <select
                      value={audioCodec}
                      onChange={(e) => setAudioCodec(e.target.value as AudioCodec)}
                      className="w-24 px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden"
                    >
                      <option value="mp3">MP3</option>
                      <option value="m4a">M4A</option>
                      <option value="flac">FLAC</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || urls.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ListPlus className="w-3.5 h-3.5" />
              )}
              <span>Queue {urls.length > 0 ? `${urls.length} Downloads` : 'Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
