import { LocalMediaRecord } from './types';
import { mediaStorage } from './MediaStorage';

export class MediaCache {
  private objectUrlMap = new Map<string, string>();

  /**
   * Resolve an in-memory Object URL for a given trackId.
   * If URL is already created, returns existing URL.
   * Otherwise fetches Blob from IndexedDB and constructs new URL.
   */
  public async getObjectUrlForTrack(trackId: string): Promise<string | null> {
    if (this.objectUrlMap.has(trackId)) {
      return this.objectUrlMap.get(trackId)!;
    }

    const record = await mediaStorage.getRecordByTrackId(trackId);
    if (!record || !record.fileBlob) {
      return null;
    }

    const objectUrl = URL.createObjectURL(record.fileBlob);
    this.objectUrlMap.set(trackId, objectUrl);
    return objectUrl;
  }

  /**
   * Register a Blob URL in cache
   */
  public registerObjectUrl(trackId: string, objectUrl: string): void {
    if (this.objectUrlMap.has(trackId)) {
      const oldUrl = this.objectUrlMap.get(trackId)!;
      if (oldUrl !== objectUrl) {
        URL.revokeObjectURL(oldUrl);
      }
    }
    this.objectUrlMap.set(trackId, objectUrl);
  }

  /**
   * Revoke and purge cached Object URL for a trackId
   */
  public revokeObjectUrl(trackId: string): void {
    if (this.objectUrlMap.has(trackId)) {
      const url = this.objectUrlMap.get(trackId)!;
      URL.revokeObjectURL(url);
      this.objectUrlMap.delete(trackId);
    }
  }

  /**
   * Check if a local media file is valid and present in storage
   */
  public async validateTrackMedia(trackId: string): Promise<boolean> {
    const record = await mediaStorage.getRecordByTrackId(trackId);
    if (!record || !record.fileBlob) {
      return false;
    }
    return record.size > 0 && record.fileBlob.size > 0;
  }

  /**
   * Calculate current storage quota usage (IndexedDB + Blob storage)
   */
  public async getStorageUsage(): Promise<{ usedBytes: number; quotaBytes: number }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usedBytes: estimate.usage || 0,
          quotaBytes: estimate.quota || 0,
        };
      } catch (e) {
        console.warn('[MediaCache] Error estimating storage quota:', e);
      }
    }

    // Fallback manual count from IndexedDB records
    const records = await mediaStorage.getAllRecords();
    const totalBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);
    return {
      usedBytes: totalBytes,
      quotaBytes: 1024 * 1024 * 1024 * 2, // 2GB default fallback estimate
    };
  }

  /**
   * Clear all active Object URLs from memory
   */
  public clearObjectUrlCache(): void {
    for (const [, url] of this.objectUrlMap.entries()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrlMap.clear();
  }
}

export const mediaCache = new MediaCache();
