import { DownloadTask, DownloadStatus } from './DownloadTypes';
import { DownloadStorage } from './DownloadStorage';

export class DownloadQueue {
  private tasks = new Map<string, DownloadTask>();
  private maxConcurrent = 2;

  constructor() {
    this.tasks = DownloadStorage.loadTasks();
  }

  public getTasksMap(): Map<string, DownloadTask> {
    return this.tasks;
  }

  public getTaskList(): DownloadTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  public getTask(trackId: string): DownloadTask | undefined {
    return this.tasks.get(trackId);
  }

  public setTask(trackId: string, task: DownloadTask): void {
    this.tasks.set(trackId, task);
    DownloadStorage.saveTasks(this.tasks);
  }

  public updateTaskStatus(
    trackId: string,
    status: DownloadStatus,
    progress?: number,
    error?: string,
    bytesDownloaded?: number,
    totalBytes?: number
  ): DownloadTask | undefined {
    const task = this.tasks.get(trackId);
    if (!task) return undefined;

    task.status = status;
    if (progress !== undefined) task.progress = progress;
    if (error !== undefined) task.error = error;
    if (bytesDownloaded !== undefined) task.downloadedBytes = bytesDownloaded;
    if (totalBytes !== undefined) task.totalSize = totalBytes;

    if (status === 'Completed') {
      task.completedAt = Date.now();
      task.progress = 100;
    }

    DownloadStorage.saveTasks(this.tasks);
    return task;
  }

  public removeTask(trackId: string): boolean {
    const deleted = this.tasks.delete(trackId);
    if (deleted) {
      DownloadStorage.saveTasks(this.tasks);
    }
    return deleted;
  }

  public clearAll(): void {
    this.tasks.clear();
    DownloadStorage.clearTasks();
  }

  public getPendingTasks(): DownloadTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === 'Waiting');
  }

  public getActiveCount(): number {
    return Array.from(this.tasks.values()).filter((t) =>
      ['Preparing', 'Downloading', 'Processing', 'Importing'].includes(t.status)
    ).length;
  }

  public canStartNew(): boolean {
    return this.getActiveCount() < this.maxConcurrent;
  }
}
