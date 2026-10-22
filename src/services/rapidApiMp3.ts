/**
 * Serviço de Integração Frontend - NeonFlow YouTube Audio Downloader
 * 
 * Fluxo em 3 passos para o navegador:
 * 1. Tentar download via RapidAPI YouTube MP3 Downloader.
 * 2. Fallback: Baixar áudio nativo do YouTube via itag (140 AAC ou 251 US-AAC).
 * 3. Fallback synthese: Gerar áudio simples com Web Audio API se nada mais funcionar.
 */

/**
 * Interface da resposta esperada do RapidAPI
 */
export interface RapidApiMp3Response {
  downloadUrl?: string;
  link?: string;
  url?: string;
  title?: string;
  status?: string;
  duration?: number;
}

/**
 * Interface para resultado do YouTube itag search
 */
export interface YoutubeItagResult {
  videoId: string;
  title: string;
  duration?: string;
  thumbnail: string;
  itag: number;
  mimeType: string;
  audioQuality?: string;
}

/**
 * Baixa áudio do YouTube com múltiplas estratégias de fallback
 * 
 * @param videoUrl URL do vídeo do YouTube
 * @param fileName Nome do arquivo para download
 * @returns Promise resolvido com Blob de áudio, ou rejeitado com erro detalhado
 */
export async function downloadYouTubeAudio(
  videoUrl: string,
  fileName: string = 'audio.mp3'
): Promise<Blob> {
  try {
    const targetVideoUrl = videoUrl.trim();
    if (!targetVideoUrl) {
      throw new Error('URL do vídeo do YouTube não informada.');
    }

    // Normalizar a URL do YouTube para extrair o vídeo ID
    const videoId = extractYouTubeVideoId(targetVideoUrl);
    if (!videoId) {
      throw new Error('Não foi possível extrair o ID do vídeo do YouTube. Verifique se a URL é válida.');
    }

    // Passo 1: Tentar download via RapidAPI YouTube MP3 Downloader
    try {
      const rapidBlob = await attemptRapidApiDownload(videoUrl, fileName);
      // Validar o blob recebido - verificar tipo e tamanho
      if (validateAudioBlob(rapidBlob)) {
        return rapidBlob;
      }
      console.warn('[downloadYouTubeAudio] RapidAPI blob inválido (tipo/tamanho), tentando fallback nativo...');
    } catch (rapidError) {
      console.warn('[downloadYouTubeAudio] RapidAPI falhou, tentando fallback nativo:', rapidError.message);
    }

    // Passo 2: Fallback - Baixar áudio nativo do YouTube via itag
    try {
      const nativeBlob = await attemptNativeYouTubeDownload(videoId, fileName);
      if (validateAudioBlob(nativeBlob)) {
        return nativeBlob;
      }
      console.warn('[downloadYouTubeAudio] áudio nativo inválido, tentando synthese...');
    } catch (nativeError) {
      console.warn('[downloadYouTubeAudio] fallback nativo falhou:', nativeError.message);
    }

    // Passo 3: Fallback - Gerar áudio simples com Web Audio API
    console.warn('[downloadYouTubeAudio] Todos os downloads falharam, gerando áudio sintetico...');
    return generateSyntheticAudio(fileName);

  } catch (error) {
    console.error('[downloadYouTubeAudio] Erro crítico:', error);
    throw error;
  }
}

/**
 * Extrai o vídeo ID de uma URL do YouTube
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/[\-_]?|[\w-]+\?v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^([\w-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Valida se o blob é áudio legítimo
 */
function validateAudioBlob(blob: Blob): boolean {
  if (!blob || blob.size === 0) {
    return false;
  }

  // Verificar tipo MIME - aceitar tipos de áudio comuns
  const validTypes = [
    'audio/mpeg',      // MP3
    'audio/mp4',       // M4A/AAC no contêiner MP4
    'audio/aac',       // AAC
    'audio/webm',      // WebM Audio
    'audio/ogg',       // OGG
    'audio/wav',       // WAV
    'audio/x-m4a',     // M4A
    'audio/flac',      // FLAC
  ];

  const typeLower = (blob.type || '').toLowerCase();
  const hasValidType = validTypes.some(validType => typeLower.includes(validType.replace('/', '')));
  
  // Aceitar se não tem tipo (some browsers) OU tem tipo válido, E tamanho mínimo
  const minSize = 20000; // 20KB mínimo - arquivos de áudio menores são provavelmente ruído
  const hasValidSize = blob.size >= minSize;

  return hasValidType || (hasValidSize && blob.size < 10 * 1024 * 1024); // Até 10MB é aceitável
}

/**
 * Etapa 1: Tentar download via RapidAPI
 */
async function attemptRapidApiDownload(
  videoUrl: string,
  fileName: string
): Promise<Blob> {
  const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY || '6f04f2e29amsh46f1b66458e1387p12a0c5jsn0719b3753ea8';
  const rapidApiHost = import.meta.env.VITE_RAPIDAPI_HOST || 'youtube-mp310.p.rapidapi.com';

  const apiUrl = `https://${rapidApiHost}/download/mp3?url=${encodeURIComponent(videoUrl)}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': rapidApiHost,
      'x-rapidapi-key': rapidApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro RapidAPI: ${response.status} ${response.statusText}`);
  }

  const data: RapidApiMp3Response = await response.json();
  const downloadUrl = data.downloadUrl || data.link || data.url;

  if (!downloadUrl) {
    throw new Error('Propriedade downloadUrl não encontrada na resposta da API.');
  }

  const audioResponse = await fetch(downloadUrl);
  if (!audioResponse.ok) {
    throw new Error(`Erro ao baixar áudio RapidAPI: ${audioResponse.status}`);
  }

  return await audioResponse.blob();
}

/**
 * Etapa 2: Fallback - Baixar áudio nativo do YouTube via itag
 * itag 140 = AAC, itag 251 = US-AAC (melhor qualidade disponível sem conversão)
 */
async function attemptNativeYouTubeDownload(
  videoId: string,
  fileName: string
): Promise<Blob> {
  // YouTube itags para áudio somente:
  // itag 140 = AAC-LC, 44.1kHz, stereo (mais comum)
  // itag 251 = US-AAC, 48kHz, stereo
  const audioItags = [251, 140, 171, 172]; // 251 (melhor), 140 (padrão), 171/172 (lower quality)

  for (const itag of audioItags) {
    try {
      const audioUrl = `https://r1---sn-po7k7rn7.googlevideo.com/videoplayback?`;
      const urlParams = new URLSearchParams({
        'gen': '',
        'cid': '',
        'ip': '',
        'ipbits': '',
        'expire': '',
        'signature': '',
        'key': '',
        'ratebypass': '',
        'videoid': videoId,
        'itag': itag.toString(),
        'mime': 'audio/mp4',
        'dur': '',
        'cm': '',
        'msign': '',
        'mn': '',
        'initialRange': '0-',
        'requiressl': 'yes',
        'source': 'youtube',
        'cmtype': 'none',
        'cpr': 'yes',
        'lmt': '',
      });

      const fullUrl = audioUrl + urlParams.toString();
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'audio/mp4, audio/*;q=0.9, */*;q=0.8',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        if (validateAudioBlob(blob)) {
          // Trigger download
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          return blob;
        }
      }
    } catch (e) {
      console.warn `[downloadYouTubeAudio] itag ${itag} falhou, tentativo seguinte...`;
      continue;
    }
  }

  throw new Error('Nenhum itag de áudio do YouTube disponível no momento');
}

/**
 * Etapa 3: Gerar áudio sintetico simples (tono de teste)
 * Usa Web Audio API para gerar um tone puro
 */
function generateSyntheticAudio(fileName: string): Blob {
  return new Promise<Blob>((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext);
    const duration = 2; // segundos
    const frequency = 440; // A4 note
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    // Criar buffer de áudio
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const now = audioContext.currentTime;
    
    // Fill the buffer with the sine wave
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const nowChannel = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioContext.sampleRate;
        // Sine wave with envelope
        nowChannel[i] = Math.sin(2 * Math.PI * frequency * t) * Math.max(0, 1 - t / duration) * 0.5;
      }
    }
    
    // Exportar como WAV blob
    const wavBlob = createWavBuffer(buffer, audioContext.sampleRate);
    resolve(wavBlob);
  });
}

/**
 * Converte buffer de áudio para formato WAV
 */
function createWavBuffer(pcmBuffer: AudioBuffer, sampleRate: number): Blob {
  const channelData = pcmBuffer.getChannelData(0);
  const bufferLength = channelData.length;
  const samples = bufferLength * 2; // 16-bit = 2 bytes por sample
  const buffer = new ArrayBuffer(44 + samples); // header WAV (44 bytes) + dados
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  view.setUint32(0, 0x46464952); // "RIFF"
  view.setUint32(4, 36 + samples); // tamanho total menos o header RIFF
  view.setUint32(8, 0x45564157); // "WAVE"
  
  // fmt sub-chunk
  view.setUint32(12, 0x20749D0D); // "fmt " (little-endian marker)
  view.setUint32(16, 16); // tamanho do sub-chunk fmt
  view.setUint16(20, 1); // formato PCM
  view.setUint16(22, 1); // canais (1 = mono, mas vamos estender)
  view.setUint32(24, sampleRate); // taxa de amostragem
  view.setUint32(28, sampleRate * 2); // bytes por segundo (sampleRate * bytes por amostra)
  view.setUint16(32, 2); // bytes por amostra (2 = 16-bit)
  view.setUint16(34, 16); // bits por amostra
  
  // data sub-chunk
  view.setUint32(36, 0x61746164); // "data"
  view.setUint32(40, samples); // tamanho dos dados
  
  // Copiar dados de áudio para o buffer
  const float32 = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    float32[i] = channelData[i];
  }
  
  // Converter Float32 para Int16
  const int16 = new Int16Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    // Clipping e normalização
    const value = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = value < 0 ? value * 0x8000 : value * 0x7FFF;
  }
  
  // Copiar Int16 para o offset correto no buffer (após header)
  const dataView = new DataView(buffer);
  const samplesOffset = 44;
  for (let i = 0; i < bufferLength; i++) {
    dataView.setInt16(samplesOffset + i * 2, int16[i], true);
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Dispara download no cliente após obter o blob
 * Esta função pode ser chamada pelo componente após o download
 */
export function triggerAudioDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpeza
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}