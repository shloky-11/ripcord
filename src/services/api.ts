import { EngineSettings, QueueItem, SystemStats, VideoMetadata, PlaylistMetadata, MediaFormat, VideoQuality, AudioQuality, AudioCodec } from '../types';

const API_BASE = '/api';

export const api = {
  async getSystemInfo(): Promise<{ ytDlpAvailable: boolean; ffmpegAvailable: boolean; ytDlpVersion: string; defaultFolder: string }> {
    const res = await fetch(`${API_BASE}/info`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },

  async getQueue(version?: number): Promise<{ items?: QueueItem[]; stats?: SystemStats; unchanged?: boolean; version?: number }> {
    const url = version !== undefined ? `${API_BASE}/queue?v=${version}` : `${API_BASE}/queue`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },

  async getSettings(): Promise<EngineSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<EngineSettings>): Promise<EngineSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const res = await fetch(`${API_BASE}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to extract video metadata');
    }
    return res.json();
  },

  async addToQueue(params: {
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }): Promise<{ item: QueueItem }> {
    const res = await fetch(`${API_BASE}/queue/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add item to queue');
    }
    return res.json();
  },

  async batchAddToQueue(items: Array<{
    url: string;
    format: MediaFormat;
    quality: VideoQuality | AudioQuality;
    audioCodec?: AudioCodec;
  }>): Promise<{ items: QueueItem[] }> {
    const res = await fetch(`${API_BASE}/queue/batch-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to batch add items');
    }
    return res.json();
  },

  async fetchPlaylistMetadata(url: string, maxItems = 200): Promise<PlaylistMetadata> {
    const res = await fetch(`${API_BASE}/playlist/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, maxItems }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load playlist');
    }
    return res.json();
  },

  async queuePlaylistItems(params: {
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
  }): Promise<{ items: QueueItem[] }> {
    const res = await fetch(`${API_BASE}/playlist/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to queue playlist items');
    }
    return res.json();
  },

  async addSampleBatch(): Promise<{ items: QueueItem[] }> {
    const res = await fetch(`${API_BASE}/queue/sample-batch`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to queue sample batch');
    return res.json();
  },

  async pauseItem(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/pause/${id}`, { method: 'POST' });
  },

  async resumeItem(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/resume/${id}`, { method: 'POST' });
  },

  async cancelItem(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/cancel/${id}`, { method: 'POST' });
  },

  async retryItem(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/retry/${id}`, { method: 'POST' });
  },

  async deleteItem(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/delete/${id}`, { method: 'POST' });
  },

  async pauseAll(): Promise<void> {
    await fetch(`${API_BASE}/queue/pause-all`, { method: 'POST' });
  },

  async resumeAll(): Promise<void> {
    await fetch(`${API_BASE}/queue/resume-all`, { method: 'POST' });
  },

  async clearCompleted(deleteFiles = false): Promise<void> {
    await fetch(`${API_BASE}/queue/clear-completed?deleteFiles=${deleteFiles}`, { method: 'POST' });
  },

  async markSavedToFolder(id: string): Promise<void> {
    await fetch(`${API_BASE}/queue/mark-saved/${id}`, { method: 'POST' });
  },

  getDownloadUrl(id: string): string {
    return `${API_BASE}/download/file/${id}`;
  },

  getStreamUrl(id: string): string {
    return `${API_BASE}/download/stream/${id}`;
  },
};
