import { storage } from '../services/storage';

/**
 * StorageRepository
 * Low-level type-safe abstraction for persistent LocalStorage access.
 */
export class StorageRepository {
  static get<T>(key: string, defaultValue: T): T {
    return storage.load<T>(key, defaultValue);
  }

  static set<T>(key: string, value: T): void {
    storage.save<T>(key, value);
  }

  static remove(key: string): void {
    storage.remove(key);
  }

  static clear(): void {
    storage.clear();
  }
}
