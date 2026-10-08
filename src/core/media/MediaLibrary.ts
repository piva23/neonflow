import { mediaStorage, MediaStorage } from './MediaStorage';
import { mediaCache, MediaCache } from './MediaCache';
import { mediaScanner, MediaScanner } from './MediaScanner';
import { mediaImportService, MediaImportService } from './MediaImportService';
import { mediaStatistics, MediaStatistics } from './MediaStatistics';
import { ImportMediaOptions, ImportMediaResult, MediaLibraryStats, ScanResult } from './types';

export class MediaLibrary {
  public readonly storage: MediaStorage = mediaStorage;
  public readonly cache: MediaCache = mediaCache;
  public readonly scanner: MediaScanner = mediaScanner;
  public readonly importer: MediaImportService = mediaImportService;
  public readonly statistics: MediaStatistics = mediaStatistics;

  /**
   * Import local audio file into IndexedDB and retrieve Track model
   */
  public async importFile(file: File, options?: ImportMediaOptions): Promise<ImportMediaResult> {
    return this.importer.importAudioFile(file, options);
  }

  /**
   * Get playable ObjectURL for a track
   */
  public async getTrackMediaUrl(trackId: string): Promise<string | null> {
    return this.cache.getObjectUrlForTrack(trackId);
  }

  /**
   * Remove a local track from IndexedDB and revoke its Object URL
   */
  public async deleteTrackMedia(trackId: string): Promise<boolean> {
    this.cache.revokeObjectUrl(trackId);
    return this.storage.removeRecordByTrackId(trackId);
  }

  /**
   * Calculate storage statistics
   */
  public async getStats(): Promise<MediaLibraryStats> {
    return this.statistics.getLibraryStats();
  }

  /**
   * Run scanner and clean orphaned records
   */
  public async scanAndClean(activeTrackIds: string[]): Promise<ScanResult> {
    const scanResult = await this.scanner.scanLibrary(activeTrackIds);
    if (scanResult.orphanedCount > 0) {
      await this.scanner.purgeOrphanedRecords(activeTrackIds);
    }
    return scanResult;
  }
}

export const mediaLibrary = new MediaLibrary();
