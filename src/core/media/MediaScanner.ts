import { ScanResult, LocalMediaRecord } from './types';
import { mediaStorage } from './MediaStorage';
import { mediaCache } from './MediaCache';

export class MediaScanner {
  /**
   * Scan local media library for valid, orphaned, or corrupted records
   */
  public async scanLibrary(knownTrackIds?: string[]): Promise<ScanResult> {
    const records = await mediaStorage.getAllRecords();
    let validCount = 0;
    let orphanedCount = 0;
    let repairedCount = 0;
    let freedBytes = 0;

    const knownTrackSet = knownTrackIds ? new Set(knownTrackIds) : null;

    for (const record of records) {
      const isValidBlob = record.fileBlob && record.fileBlob.size > 0;
      const isKnownTrack = knownTrackSet ? knownTrackSet.has(record.trackId) : true;

      if (!isValidBlob) {
        // Remove corrupted entry missing valid blob
        await mediaStorage.removeRecordByTrackId(record.trackId);
        mediaCache.revokeObjectUrl(record.trackId);
        repairedCount++;
        freedBytes += record.size || 0;
      } else if (!isKnownTrack) {
        // Orphaned record with no corresponding Track in track metadata library
        orphanedCount++;
      } else {
        validCount++;
      }
    }

    return {
      scannedCount: records.length,
      validCount,
      orphanedCount,
      repairedCount,
      freedBytes,
    };
  }

  /**
   * Remove orphaned records that no longer exist in the music library
   */
  public async purgeOrphanedRecords(activeTrackIds: string[]): Promise<number> {
    const records = await mediaStorage.getAllRecords();
    const activeSet = new Set(activeTrackIds);
    let purgedCount = 0;

    for (const record of records) {
      if (!activeSet.has(record.trackId)) {
        await mediaStorage.removeRecordByTrackId(record.trackId);
        mediaCache.revokeObjectUrl(record.trackId);
        purgedCount++;
      }
    }

    return purgedCount;
  }

  /**
   * Verify integrity of a single local record
   */
  public async verifyRecordIntegrity(record: LocalMediaRecord): Promise<boolean> {
    if (!record || !record.fileBlob) return false;
    if (record.fileBlob.size === 0) return false;
    return true;
  }
}

export const mediaScanner = new MediaScanner();
