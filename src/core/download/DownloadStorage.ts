import { DownloadTask } from './DownloadTypes';
import { storage } from '../../services/storage';

const TASKS_STORAGE_KEY = 'neonflow_download_tasks_queue';

export class DownloadStorage {
  public static saveTasks(tasks: Map<string, DownloadTask>): void {
    try {
      const array = Array.from(tasks.values());
      storage.save(TASKS_STORAGE_KEY, array);
    } catch (err) {
      console.error('[DownloadStorage] Error saving tasks:', err);
    }
  }

  public static loadTasks(): Map<string, DownloadTask> {
    try {
      const array = storage.load<DownloadTask[]>(TASKS_STORAGE_KEY, []);
      const map = new Map<string, DownloadTask>();
      if (Array.isArray(array)) {
        array.forEach((task) => {
          if (['Downloading', 'Preparing', 'Processing', 'Importing'].includes(task.status)) {
            task.status = 'Waiting';
            task.progress = 0;
          }
          map.set(task.trackId, task);
        });
      }
      return map;
    } catch (err) {
      console.error('[DownloadStorage] Error loading tasks:', err);
      return new Map();
    }
  }

  public static clearTasks(): void {
    storage.remove(TASKS_STORAGE_KEY);
  }
}
