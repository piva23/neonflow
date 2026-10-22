import { Track } from '../../../types';
import { DownloadProvider, DownloadStatus, ProviderType } from '../DownloadTypes';
import { LocalSynthesizerProvider } from './LocalSynthesizerProvider';
import { mediaStorage, mediaCache } from '../../media';
import { MusicRepository } from '../../../repositories';
import toast from 'react-hot-toast';

/**
 * YouTube Rest Provider - Versão simplificada
 * 
 * Nota: O download de áudio MP3 via RapidAPI e itags do YouTube
 * não está disponível neste ambiente de deployment (erros 502 e DNS).
 * O player foca na reprodução nativa do YouTube embutido.
 */

export class YouTubeRestProvider implements DownloadProvider {
  private activeDownloads = new Map<string, boolean>();

  public getName(): string {
    return 'YouTube Playback (Embedded)';
  }

  public getType(): ProviderType {
    return 'youtube_embedded';
  }

  public isAvailable(): boolean {
    return true;
  }

  public getStatus(downloadId: string): DownloadStatus {
    return this.activeDownloads.get(downloadId) ? 'Cancelled' : 'Playing';
  }

  public cancelDownload(downloadId: string): void {
    this.activeDownloads.set(downloadId, true);
  }

  public async startDownload(
    track: Track,
    onProgress?: (progress: number, downloadedBytes?: number, totalBytes?: number) => void
  ): Promise<Blob> {
    this.activeDownloads.set(track.id, true);

    // O download direto de áudio MP3 não está disponível neste ambiente.
    // Mostrar aviso e usar reprodução nativa do YouTube.
    toast({
      title: 'Download Desabilitado',
      description: 'Reprodução nativa do YouTube em vez de download MP3.',
      variant: 'info',
    });

    // Retornar blob sintético curto para indicar que o track está ativo
    // O player usará a URL do YouTube embutida para playback
    return new Blob([''], { type: 'audio/mpeg' });
  }
}