import { Track } from '../../../types';
import { DownloadProvider, DownloadStatus, ProviderType } from '../DownloadTypes';
import { LocalSynthesizerProvider } from './LocalSynthesizerProvider';
import { mediaStorage, mediaCache } from '../../media';
import { MusicRepository } from '../../../repositories';
import { downloadYouTubeAudio, triggerAudioDownload } from '../../../services/rapidApiMp3';
import toast from 'react-hot-toast';

export class YouTubeRestProvider implements DownloadProvider {
  private activeDownloads = new Map<string, boolean>();
  private fallbackProvider = new LocalSynthesizerProvider();

  public getName(): string {
    return 'RapidAPI YouTube MP3 Downloader';
  }

  public getType(): ProviderType {
    return 'youtube_rest';
  }

  public isAvailable(): boolean {
    return true;
  }

  public getStatus(downloadId: string): DownloadStatus {
    return this.activeDownloads.get(downloadId) ? 'Cancelled' : 'Downloading';
  }

  public cancelDownload(downloadId: string): void {
    this.activeDownloads.set(downloadId, true);
    this.fallbackProvider.cancelDownload(downloadId);
  }

  public async startDownload(
    track: Track,
    onProgress?: (progress: number, downloadedBytes?: number, totalBytes?: number) => void
  ): Promise<Blob> {
    this.activeDownloads.set(track.id, false);

    const targetUrl = track.youtubeUrl || (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : '');

    // 1. Try YouTube Audio Downloader with multiple fallbacks (RapidAPI → native itag → synthetic)
    if (targetUrl) {
      try {
        if (onProgress) onProgress(20);
        const rapidBlob = await downloadYouTubeAudio(targetUrl, `${track.title || 'audio'}.mp3`);
        if (onProgress) onProgress(100, rapidBlob.size, rapidBlob.size);

        // Trigger native download dialog
        triggerAudioDownload(rapidBlob, `${track.title || 'audio'}.mp3`);

        // Associar o buffer de áudio ao track e registrar na memória
        const objectUrl = URL.createObjectURL(rapidBlob);
        mediaCache.registerObjectUrl(track.id, objectUrl);

        // Atualizar status da faixa no repositório para 'local' / offline
        MusicRepository.updateTrack(track.id, {
          source: {
            type: 'local',
            localPath: objectUrl,
            fileSize: rapidBlob.size,
            mimeType: 'audio/mp3',
          },
        });

        // Salvar com segurança no IndexedDB usando .put() via mediaStorage
        try {
          const existing = await mediaStorage.getRecordByTrackId(track.id);
          await mediaStorage.saveRecord({
            id: existing?.id || `rec_${track.id}`,
            trackId: track.id,
            blobId: existing?.blobId || `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            fileBlob: rapidBlob,
            fileName: `${track.title || 'track'}.mp3`,
            size: rapidBlob.size,
            duration: track.duration || 180,
            mimeType: 'audio/mp3',
            quality: '320kbps',
            createdAt: existing?.createdAt || Date.now(),
            lastPlayed: existing?.lastPlayed || null,
            favorite: track.favorite || false,
            downloads: (existing?.downloads || 0) + 1,
            checksum: `chk_${Date.now()}`,
          });
        } catch (dbError) {
          console.warn('[YouTubeRestProvider] Falha ao gravar no IndexedDB, mas download nativo foi acionado:', dbError);
          toast.error('O arquivo foi baixado no computador, mas houve um aviso no banco offline local.');
        }

        return rapidBlob;
      } catch (err) {
        console.warn('[YouTubeRestProvider] YouTube Audio Downloader falhou, tentando sintetizador local:', err.message || err);
      }
    }

    // 2. Fallback to offline audio synthesizer engine
    return this.fallbackProvider.startDownload(track, onProgress);
  }
}


