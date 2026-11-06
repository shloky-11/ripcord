export type MediaFormat = 'video' | 'audio';

export type VideoQuality = 'best' | '1080p' | '720p' | '480p' | '360p';

export type AudioQuality = '320k' | '256k' | '192k' | '128k';

export type AudioCodec = 'mp3' | 'm4a' | 'flac' | 'wav' | 'aac';

export type QueueStatus = 
  | 'queued' 
  | 'downloading' 
  | 'processing' 
  | 'completed' 
  | 'paused' 
  | 'error' 
  | 'cancelled';

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  author: string;
  thumbnail: string;
  duration?: string;
  format: MediaFormat;
  quality: VideoQuality | AudioQuality;
  audioCodec?: AudioCodec;
  status: QueueStatus;
  progress: number; // 0 to 100
  speed: string; // e.g., "14.2 MB/s"
  speedBytesPerSec: number;
  transferredBytes: number;
  totalBytes: number;
  eta: string; // e.g., "00:15"
  error?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  createdAt: number;
  completedAt?: number;
  savedToLocalFolder?: boolean;
  engineUsed?: 'yt-dlp' | 'stream-synthesizer' | 'direct';
}

export interface EngineSettings {
  maxConcurrent: number; // 1 to 8
  concurrentFragments: number; // 4, 8, 16
  turboMode: boolean;
  autoSaveToFolder: boolean;
  defaultFormat: MediaFormat;
  defaultVideoQuality: VideoQuality;
  defaultAudioQuality: AudioQuality;
  defaultAudioCodec: AudioCodec;
  cookies: string;
}

export interface SystemStats {
  activeDownloads: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  totalSpeedBytesPerSec: number;
  totalSpeedFormatted: string;
  totalDownloadedBytes: number;
  totalDownloadedFormatted: string;
  ytDlpAvailable: boolean;
  ffmpegAvailable: boolean;
}

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  author: string;
  authorUrl?: string;
  thumbnail: string;
  duration?: string;
}
