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
 * não está disponível neste ambiente de deployment (erros 502, DNS
 * ERR_NAME_NOT_RESOLVED e ERR_REQUEST_RANGE_NOT_SATISFIABLE).
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
    // O NeonFlow usa reprodução nativa do YouTube embutido.
    toast({
      title: 'Reprodução Native do YouTube',
      description: 'Toque a faixa diretamente no player. Download MP3 desabilitado temporariamente.',
      variant: 'info',
    });

    // Retornar blob nulo - o player usará a URL do YouTube embutida
    // para playback em vez de um arquivo download.
    return new Blob([], { type: 'audio/mpeg' });
  }
}