import { DownloadProvider, ProviderType } from './DownloadTypes';
import { LocalSynthesizerProvider } from './providers/LocalSynthesizerProvider';
import { YouTubeRestProvider } from './providers/YouTubeRestProvider';
import { storage } from '../../services/storage';

const PROVIDER_STORAGE_KEY = 'neonflow_active_download_provider';
const ENDPOINT_STORAGE_KEY = 'neonflow_download_endpoint_url';

export class ProviderFactory {
  public static getActiveProvider(): DownloadProvider {
    const activeType = (storage.load<string>(PROVIDER_STORAGE_KEY, 'youtube_rest') as ProviderType) || 'youtube_rest';
    const endpointUrl = storage.load<string>(ENDPOINT_STORAGE_KEY, '') || '';

    switch (activeType) {
      case 'youtube_rest':
      case 'cloudflare_worker':
      case 'firebase_function':
      case 'node_server':
        return new YouTubeRestProvider();
      case 'local_synthesizer':
      default:
        return new LocalSynthesizerProvider();
    }
  }

  public static setActiveProvider(type: ProviderType, endpointUrl?: string): void {
    storage.save(PROVIDER_STORAGE_KEY, type);
    if (endpointUrl !== undefined) {
      storage.save(ENDPOINT_STORAGE_KEY, endpointUrl);
    }
  }

  public static getActiveProviderType(): ProviderType {
    return (storage.load<string>(PROVIDER_STORAGE_KEY, 'youtube_rest') as ProviderType) || 'youtube_rest';
  }

  public static getEndpointUrl(): string {
    return storage.load<string>(ENDPOINT_STORAGE_KEY, '') || '';
  }

  public static getAvailableProviders(): { type: ProviderType; name: string; description: string }[] {
    return [
      {
        type: 'youtube_rest',
        name: 'Servidor REST / API YouTube (Recomendado)',
        description: 'Converte vídeos em MP3 320kbps via endpoint configurável com fallback seguro.',
      },
      {
        type: 'cloudflare_worker',
        name: 'Cloudflare Worker Audio Proxy',
        description: 'Serviço Serverless de alta velocidade e baixa latência.',
      },
      {
        type: 'firebase_function',
        name: 'Firebase Functions MP3 Converter',
        description: 'Execução de conversão sob demanda na nuvem.',
      },
      {
        type: 'local_synthesizer',
        name: 'Sintetizador WebAudio Local (Offline Direct)',
        description: 'Gera arquivos de áudio de alta qualidade diretamente no navegador sem servidor externo.',
      },
    ];
  }
}
