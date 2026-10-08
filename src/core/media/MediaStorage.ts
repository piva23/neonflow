import { LocalMediaRecord } from './types';

const DB_NAME = 'NeonFlow_MediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'local_media';

export class MediaStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('trackId', 'trackId', { unique: true });
          store.createIndex('blobId', 'blobId', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastPlayed', 'lastPlayed', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[MediaStorage] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a media record to IndexedDB using .put() upsert safely.
   * Resolves any existing primary key 'id' by trackId to prevent IndexedDB unique constraint violations.
   */
  public async saveRecord(record: LocalMediaRecord): Promise<void> {
    try {
      const db = await this.getDB();

      // Check if a record with the same trackId already exists
      try {
        const existing = await this.getRecordByTrackId(record.trackId);
        if (existing) {
          record.id = existing.id;
          if (!record.blobId) {
            record.blobId = existing.blobId;
          }
        }
      } catch (lookupErr) {
        console.warn('[MediaStorage] Track lookup failed prior to put():', lookupErr);
      }

      return await new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(record);

          req.onsuccess = () => resolve();
          req.onerror = () => {
            console.error('[MediaStorage] Failed to save record via store.put():', req.error);
            reject(req.error || new Error('IndexedDB put operation failed'));
          };
        } catch (txErr) {
          console.error('[MediaStorage] Transaction creation failed:', txErr);
          reject(txErr);
        }
      });
    } catch (error) {
      console.error('[MediaStorage] Safe saveRecord caught error:', error);
      throw error;
    }
  }

  /**
   * Get a media record by record ID or trackId
   */
  public async getRecordByTrackId(trackId: string): Promise<LocalMediaRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('trackId');
      const req = index.get(trackId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get a record by ID
   */
  public async getRecordById(id: string): Promise<LocalMediaRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * List all media records
   */
  public async getAllRecords(): Promise<LocalMediaRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Remove record by trackId
   */
  public async removeRecordByTrackId(trackId: string): Promise<boolean> {
    const record = await this.getRecordByTrackId(trackId);
    if (!record) return false;

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(record.id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Update lastPlayed timestamp for a track record
   */
  public async updateLastPlayed(trackId: string, timestamp: number = Date.now()): Promise<void> {
    const record = await this.getRecordByTrackId(trackId);
    if (record) {
      record.lastPlayed = timestamp;
      await this.saveRecord(record);
    }
  }

  /**
   * Clear all stored local media
   */
  public async clearAll(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const mediaStorage = new MediaStorage();
