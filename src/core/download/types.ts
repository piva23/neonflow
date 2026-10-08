export type DownloadStatus = 'not_downloaded' | 'downloading' | 'converting' | 'ready' | 'error';

export interface DownloadTask {
  trackId: string;
  trackTitle: string;
  artist: string;
  status: DownloadStatus;
  progress: number; // 0 to 100
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export type DownloadListener = (tasks: Map<string, DownloadTask>) => void;
