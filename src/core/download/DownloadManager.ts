import { Track } from '../../types';
import { DownloadTask, DownloadStatus, DownloadListener } from './DownloadTypes';
import { DownloadQueue } from './DownloadQueue';
import { ProviderFactory } from './ProviderFactory';
import { downloadEvents } from './DownloadEvents';
import { mediaStorage, mediaCache, LocalMediaRecord } from '../media';
import { MusicRepository } from '../../repositories';
import toast from 'react-hot-toast';

export class DownloadManager {
  private static instance: DownloadManager | null = null;
  private queue = new DownloadQueue();
  private listeners = new Set<DownloadListener>();
  private activeDownloadCancelTokens = new Map<string, boolean>();

  private constructor() {
    setTimeout(() => this.processQueue(), 1000);
  }

  public static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  public subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    listener(new Map(this.queue.getTasksMap()));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const tasksCopy = new Map(this.queue.getTasksMap());
    this.listeners.forEach((listener) => listener(tasksCopy));
  }

  public getTask(trackId: string): DownloadTask | undefined {
    return this.queue.getTask(trackId);
  }

  public getQueue(): DownloadTask[] {
    return this.queue.getTaskList();
  }

  public async isTrackOffline(track: Track): Promise<boolean> {
    if (track.source?.type === 'local') return true;
    const record = await mediaStorage.getRecordByTrackId(track.id);
    return !!(record && record.fileBlob && record.fileBlob.size > 0);
  }

  public async startDownload(
    track: Track,
    onCompleteTrackUpdate?: (updatedTrack: Track) => void
  ): Promise<boolean> {
    const existingTask = this.queue.getTask(track.id);
    if (existingTask && ['Downloading', 'Preparing', 'Processing', 'Importing'].includes(existingTask.status)) {
      toast.error('O download desta música já está em andamento');
      return false;
    }

    const provider = ProviderFactory.getActiveProvider();
    const task: DownloadTask = {
      id: `dl_${track.id}_${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      youtubeId: track.youtubeId,
      status: 'Waiting',
      progress: 0,
      startedAt: Date.now(),
      providerName: provider.getName(),
    };

    this.queue.setTask(track.id, task);
    this.activeDownloadCancelTokens.set(track.id, false);
    this.notify();

    toast.success(`Download iniciado: ${track.title}`, {
      icon: '⬇️',
    });

    downloadEvents.emit('DOWNLOAD_STARTED', { task, track });

    return this.executeDownload(track, task, provider, onCompleteTrackUpdate);
  }

  private async processQueue(): Promise<void> {
    if (!this.queue.canStartNew()) return;
    const pending = this.queue.getPendingTasks();
    if (pending.length === 0) return;

    for (const task of pending) {
      if (!this.queue.canStartNew()) break;
      const track = MusicRepository.getById(task.trackId);
      if (track) {
        const provider = ProviderFactory.getActiveProvider();
        this.executeDownload(track, task, provider);
      }
    }
  }

  private async executeDownload(
    track: Track,
    task: DownloadTask,
    provider: any,
    onCompleteTrackUpdate?: (updatedTrack: Track) => void
  ): Promise<boolean> {
    try {
      this.queue.updateTaskStatus(track.id, 'Preparing', 5);
      this.notify();
      downloadEvents.emit('DOWNLOAD_PROGRESS', { task, track, progress: 5 });

      await this.delay(200);

      if (this.activeDownloadCancelTokens.get(track.id)) {
        this.handleCancelled(track.id);
        return false;
      }

      this.queue.updateTaskStatus(track.id, 'Downloading', 15);
      this.notify();

      const audioBlob = await provider.startDownload(track, (p: number, downloaded?: number, total?: number) => {
        if (this.activeDownloadCancelTokens.get(track.id)) {
          provider.cancelDownload(track.id);
          return;
        }
        this.queue.updateTaskStatus(track.id, 'Downloading', p, undefined, downloaded, total);
        this.notify();
        downloadEvents.emit('DOWNLOAD_PROGRESS', { task, track, progress: p });
      });

      if (this.activeDownloadCancelTokens.get(track.id)) {
        this.handleCancelled(track.id);
        return false;
      }

      this.queue.updateTaskStatus(track.id, 'Processing', 85);
      this.notify();
      downloadEvents.emit('DOWNLOAD_PROGRESS', { task, track, progress: 85 });

      await this.delay(200);

      this.queue.updateTaskStatus(track.id, 'Importing', 95);
      this.notify();

      const objectUrl = URL.createObjectURL(audioBlob);
      mediaCache.registerObjectUrl(track.id, objectUrl);

      try {
        const existingRecord = await mediaStorage.getRecordByTrackId(track.id);
        const record: LocalMediaRecord = {
          id: existingRecord?.id || `rec_${track.id}`,
          trackId: track.id,
          blobId: existingRecord?.blobId || `offline_blob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileBlob: audioBlob,
          fileName: `${track.artist} - ${track.title}.mp3`,
          size: audioBlob.size,
          duration: track.duration || 180,
          mimeType: 'audio/mpeg',
          quality: '320kbps MP3',
          createdAt: existingRecord?.createdAt || Date.now(),
          lastPlayed: existingRecord?.lastPlayed || null,
          favorite: track.favorite || false,
          downloads: (existingRecord?.downloads || 0) + 1,
          checksum: `offline_${track.id}_${Date.now()}`,
        };

        await mediaStorage.saveRecord(record);
      } catch (storageErr) {
        console.warn('[DownloadManager] MediaStorage saveRecord warn:', storageErr);
      }

      const updatedTrack: Track = {
        ...track,
        source: {
          type: 'local',
          localPath: objectUrl,
          fileSize: audioBlob.size,
          mimeType: 'audio/mpeg',
        },
      };

      MusicRepository.updateTrack(track.id, {
        source: updatedTrack.source,
      });

      if (onCompleteTrackUpdate) {
        onCompleteTrackUpdate(updatedTrack);
      }

      this.queue.updateTaskStatus(track.id, 'Completed', 100);
      this.notify();

      toast.success(`Download concluído: ${track.title}!`, {
        icon: '✅',
      });

      downloadEvents.emit('DOWNLOAD_COMPLETED', { task, track });
      downloadEvents.emit('OFFLINE_AVAILABLE', { track });

      this.processQueue();
      return true;
    } catch (err: any) {
      console.error('[DownloadManager] Download failed for track:', track.title, err);
      const errorMsg = err?.message || 'Falha na conversão offline do áudio';

      this.queue.updateTaskStatus(track.id, 'Failed', 0, errorMsg);
      this.notify();

      toast.error(`Falha no download: ${track.title}`);
      downloadEvents.emit('DOWNLOAD_FAILED', { task, track, error: errorMsg });

      this.processQueue();
      return false;
    } finally {
      this.activeDownloadCancelTokens.delete(track.id);
    }
  }

  public cancelDownload(trackId: string): void {
    this.activeDownloadCancelTokens.set(trackId, true);
    const task = this.queue.getTask(trackId);
    if (task) {
      this.handleCancelled(trackId);
    }
  }

  private handleCancelled(trackId: string): void {
    this.queue.updateTaskStatus(trackId, 'Cancelled', 0, 'Cancelado pelo usuário');
    this.notify();
    toast('Download cancelado', { icon: '🚫' });
    downloadEvents.emit('DOWNLOAD_CANCELLED', { trackId });
    this.processQueue();
  }

  public removeDownloadTask(trackId: string): void {
    this.queue.removeTask(trackId);
    this.notify();
  }

  public async deleteOfflineTrack(trackId: string): Promise<boolean> {
    try {
      await mediaStorage.removeRecordByTrackId(trackId);
      mediaCache.revokeObjectUrl(trackId);

      const track = MusicRepository.getById(trackId);
      if (track) {
        const revertedTrack: Track = {
          ...track,
          source: {
            type: 'youtube',
            youtubeId: track.youtubeId,
            youtubeUrl: track.youtubeUrl || `https://www.youtube.com/watch?v=${track.youtubeId}`,
          },
        };
        MusicRepository.updateTrack(trackId, { source: revertedTrack.source });
      }

      this.queue.removeTask(trackId);
      this.notify();
      toast.success('Música offline removida do dispositivo');
      return true;
    } catch (err) {
      console.error('[DownloadManager] Error deleting offline track:', err);
      toast.error('Erro ao remover arquivo offline');
      return false;
    }
  }

  public async clearAllDownloads(): Promise<void> {
    await mediaStorage.clearAll();
    mediaCache.clearObjectUrlCache();
    this.queue.clearAll();
    this.notify();
    toast.success('Todos os downloads e cache offline foram limpos');
  }

  public async rebuildCache(): Promise<number> {
    const records = await mediaStorage.getAllRecords();
    let count = 0;
    records.forEach((rec) => {
      if (rec.fileBlob) {
        const objectUrl = URL.createObjectURL(rec.fileBlob);
        mediaCache.registerObjectUrl(rec.trackId, objectUrl);
        count++;
      }
    });
    toast.success(`Cache reconstruído para ${count} músicas armazenadas`);
    return count;
  }

  public async scanOrphanFiles(): Promise<number> {
    const records = await mediaStorage.getAllRecords();
    const allTracks = MusicRepository.getAll();
    const trackIds = new Set(allTracks.map((t) => t.id));

    let orphansCount = 0;
    for (const rec of records) {
      if (!trackIds.has(rec.trackId)) {
        await mediaStorage.removeRecordByTrackId(rec.trackId);
        orphansCount++;
      }
    }
    toast.success(`Varredura concluída: ${orphansCount} arquivos órfãos removidos`);
    return orphansCount;
  }

  public async getStorageUsage(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number; localTracksCount: number }> {
    const records = await mediaStorage.getAllRecords();
    const usedBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);

    let quotaBytes = 1024 * 1024 * 1024 * 2;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) quotaBytes = est.quota;
      } catch (e) {
        // default
      }
    }

    const percentage = Math.min(100, Number(((usedBytes / quotaBytes) * 100).toFixed(1)));
    return {
      usedBytes,
      quotaBytes,
      percentage,
      localTracksCount: records.length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}

export const downloadManager = DownloadManager.getInstance();
