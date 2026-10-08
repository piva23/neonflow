/**
 * NeonFlow LocalStorage Management Service
 * Includes namespace sandboxing and structural versioning to prevent cache/state breaking.
 */

const STORAGE_PREFIX = 'neonflow_v1_';

export const storage = {
  /**
   * Save a key-value pair to localStorage
   */
  save<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue);
    } catch (error) {
      console.error(`[Storage Service] Error saving key "${key}":`, error);
    }
  },

  /**
   * Load a value from localStorage, fallback to defaultValue if not found or corrupted
   */
  load<T>(key: string, defaultValue: T): T {
    try {
      const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[Storage Service] Error loading key "${key}", using default:`, error);
      return defaultValue;
    }
  },

  /**
   * Remove a key from localStorage
   */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error(`[Storage Service] Error removing key "${key}":`, error);
    }
  },

  /**
   * Clear all items starting with the prefix from localStorage
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.error('[Storage Service] Error clearing storage:', error);
    }
  },
};
