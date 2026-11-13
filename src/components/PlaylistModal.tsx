import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ListVideo,
  Video,
  Music,
  Loader2,
  Clipboard,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Download
} from 'lucide-react';
import {
  PlaylistMetadata,
  MediaFormat,
  VideoQuality,
  AudioQuality,
  AudioCodec
} from '../types';
import { api } from '../services/api';

interface PlaylistModalProps {
  isOpen: boolean;
  initialUrl?: string;
  onClose: () => void;
  onQueuePlaylist: (params: {
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
  }) => Promise<void>;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  initialUrl = '',
  onClose,
  onQueuePlaylist,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [playlist, setPlaylist] = useState<PlaylistMetadata | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [format, setFormat] = useState<MediaFormat>('video');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('1080p');
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('320k');
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPlaylist = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Please enter a playlist URL');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setPlaylist(null);
      setSelectedIds(new Set());
      setFilterQuery('');
      const data = await api.fetchPlaylistMetadata(trimmed);
      setPlaylist(data);
      const validIds = new Set(
        data.entries.filter((e) => !e.unavailable).map((e) => `${e.index}_${e.id}`)
      );
      setSelectedIds(validIds);
    } catch (err: any) {
      setError(err.message || 'Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialUrl && initialUrl.trim()) {
        setUrl(initialUrl.trim());
        loadPlaylist(initialUrl.trim());
      }
    } else {
      setError('');
    }
  }, [isOpen, initialUrl, loadPlaylist]);

  const filteredEntries = useMemo(() => {
    if (!playlist) return [];
    const q = filterQuery.trim().toLowerCase();
    if (!q) return playlist.entries;
    return playlist.entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q)
    );
  }, [playlist, filterQuery]);

  const selectableCount = useMemo(() => {
    if (!playlist) return 0;
    return playlist.entries.filter((e) => !e.unavailable).length;
  }, [playlist]);

  const selectedEntries = useMemo(() => {
    if (!playlist) return [];
    return playlist.entries.filter(
      (e) => !e.unavailable && selectedIds.has(`${e.index}_${e.id}`)
    );
  }, [playlist, selectedIds]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError('');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const toggleEntry = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!playlist) return;
    setSelectedIds(
      new Set(playlist.entries.filter((e) => !e.unavailable).map((e) => `${e.index}_${e.id}`))
    );
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleQueueSelected = async () => {
    if (!playlist || selectedEntries.length === 0) return;

    try {
      setIsSubmitting(true);
      setError('');
      await onQueuePlaylist({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        items: selectedEntries.map((entry) => ({
          url: entry.url,
          title: entry.title,
          author: entry.author,
          thumbnail: entry.thumbnail,
          duration: entry.duration,
        })),
        format,
        quality: format === 'video' ? videoQuality : audioQuality,
        audioCodec: format === 'audio' ? audioCodec : undefined,
      });
      setPlaylist(null);
      setUrl('');
      setSelectedIds(new Set());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to queue playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <ListVideo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Playlist Downloader
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
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Playlist URL Loader */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPlaylist(url);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Paste YouTube playlist link (e.g. https://www.youtube.com/playlist?list=...)"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 pr-9"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListVideo className="w-3.5 h-3.5" />}
              <span>{isLoading ? 'Loading...' : 'Load Playlist'}</span>
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Fetching playlist tracks and metadata...</span>
            </div>
          )}

          {playlist && !isLoading && (
            <>
              {/* Playlist Summary & Selection Controls */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {playlist.author} · {playlist.itemCount} videos ({selectedEntries.length} selected)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>All ({selectableCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <Square className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                </div>

                {/* Filter inside playlist */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter tracks in this playlist..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Scrollable Track Checklist */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {filteredEntries.map((entry) => {
                  const key = `${entry.index}_${entry.id}`;
                  const isChecked = selectedIds.has(key);
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors ${
                        entry.unavailable
                          ? 'opacity-45 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={entry.unavailable}
                        checked={isChecked}
                        onChange={() => toggleEntry(key)}
                        className="w-4 h-4 accent-blue-600 rounded shrink-0 cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-neutral-400 w-6 text-right shrink-0">
                        {entry.index}
                      </span>
                      <div className="w-14 h-8 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
                        {entry.thumbnail && (
                          <img
                            src={entry.thumbnail}
                            alt={entry.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {entry.author}
                          {entry.duration ? ` · ${entry.duration}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No playlist tracks match "{filterQuery}".
                  </div>
                )}
              </div>

              {/* Format & Quality Presets for Selected Items */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col gap-3">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Format & Quality for Selected Tracks
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                        <option value="best">Best Available (up to 4K)</option>
                        <option value="1080p">1080p Full HD</option>
                        <option value="720p">720p HD</option>
                        <option value="480p">480p Standard</option>
                        <option value="360p">360p Compact</option>
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
                          <option value="wav">WAV</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleQueueSelected}
            disabled={isSubmitting || isLoading || selectedEntries.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {selectedEntries.length > 0
                ? `Queue ${selectedEntries.length} ${selectedEntries.length === 1 ? 'Track' : 'Tracks'}`
                : 'Queue Playlist'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
