import { Track } from '../../types';

export interface LocalMediaRecord {
  id: string;
  trackId: string;
  blobId: string;
  fileBlob: Blob;
  fileName: string;
  size: number;
  duration: number;
  mimeType: string;
  quality: string;
  createdAt: number;
  lastPlayed: number | null;
  favorite: boolean;
  downloads: number;
  checksum: string;
}

export interface MediaLibraryStats {
  totalCount: number;
  totalSize: number; // in bytes
  totalSizeFormatted: string;
  totalDuration: number; // in seconds
  totalDurationFormatted: string;
  formatBreakdown: Record<string, number>;
  averageQuality: string;
}

export interface ImportMediaOptions {
  favorite?: boolean;
  quality?: string;
  album?: string;
  artist?: string;
}

export interface ImportMediaResult {
  track: Track;
  record: LocalMediaRecord;
  objectUrl: string;
}

export interface ScanResult {
  scannedCount: number;
  validCount: number;
  orphanedCount: number;
  repairedCount: number;
  freedBytes: number;
}
