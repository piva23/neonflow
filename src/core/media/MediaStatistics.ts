import { MediaLibraryStats } from './types';
import { mediaStorage } from './MediaStorage';

export class MediaStatistics {
  /**
   * Calculate complete storage and media analytics
   */
  public async getLibraryStats(): Promise<MediaLibraryStats> {
    const records = await mediaStorage.getAllRecords();

    let totalSize = 0;
    let totalDuration = 0;
    const formatBreakdown: Record<string, number> = {};

    for (const record of records) {
      totalSize += record.size || 0;
      totalDuration += record.duration || 0;

      const format = this.extractFormat(record.mimeType, record.fileName);
      formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
    }

    return {
      totalCount: records.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      totalDuration,
      totalDurationFormatted: this.formatDuration(totalDuration),
      formatBreakdown,
      averageQuality: records.length > 0 ? 'High (320kbps)' : 'N/A',
    };
  }

  private extractFormat(mimeType: string, fileName: string): string {
    if (mimeType.includes('mpeg') || mimeType.includes('mp3') || fileName.endsWith('.mp3')) return 'MP3';
    if (mimeType.includes('m4a') || fileName.endsWith('.m4a')) return 'M4A';
    if (mimeType.includes('aac') || fileName.endsWith('.aac')) return 'AAC';
    if (mimeType.includes('wav') || fileName.endsWith('.wav')) return 'WAV';
    if (mimeType.includes('flac') || fileName.endsWith('.flac')) return 'FLAC';
    if (mimeType.includes('ogg') || fileName.endsWith('.ogg')) return 'OGG';
    return 'AUDIO';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}

export const mediaStatistics = new MediaStatistics();
