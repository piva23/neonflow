import { Track } from '../../types';

export type DownloadStatus =
  | 'Waiting'
  | 'Preparing'
  | 'Downloading'
  | 'Processing'
  | 'Importing'
  | 'Completed'
  | 'Cancelled'
  | 'Failed';

export type ProviderType =
  | 'youtube_rest'
  | 'cloudflare_worker'
  | 'firebase_function'
  | 'node_server'
  | 'local_synthesizer';

export interface DownloadTask {
  id: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  thumbnail?: string;
  youtubeId?: string;
  status: DownloadStatus;
  progress: number; // 0 to 100
  speedBytesPerSec?: number;
  totalSize?: number;
  downloadedBytes?: number;
  error?: string;
  startedAt: number;
  completedAt?: number;
  providerName: string;
}

export interface TrackDownloadInfo {
  downloadId: string;
  isOffline: boolean;
  downloadStatus: DownloadStatus;
  downloadProgress: number;
  downloadDate?: number;
  downloadProvider?: string;
  downloadSize?: number;
}

export interface DownloadProvider {
  getName(): string;
  getType(): ProviderType;
  isAvailable(): boolean;
  startDownload(
    track: Track,
    onProgress?: (progress: number, downloadedBytes?: number, totalBytes?: number) => void
  ): Promise<Blob>;
  cancelDownload(downloadId: string): void;
  getStatus(downloadId: string): DownloadStatus;
}

export type DownloadListener = (tasks: Map<string, DownloadTask>) => void;
