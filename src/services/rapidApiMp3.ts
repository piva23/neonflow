/**
 * Serviço de Integração Frontend - RapidAPI YouTube MP3 Downloader
 * 
 * Fluxo em 2 passos para o navegador:
 * 1. Obter 'downloadUrl' temporário via GET com a chave RapidAPI.
 * 2. Baixar os bytes do MP3 como Blob, salvar no IndexedDB e acionar o download nativo com tag <a> oculta.
 */

export interface RapidApiMp3Response {
  downloadUrl?: string;
  link?: string;
  url?: string;
  title?: string;
  status?: string;
}

export async function downloadYouTubeMp3RapidApi(
  videoUrl: string,
  fileName: string = 'audio.mp3'
): Promise<Blob> {
  try {
    const targetVideoUrl = videoUrl.trim();
    if (!targetVideoUrl) {
      throw new Error('URL do vídeo do YouTube não informada.');
    }

    // Passo 1: Obter o link de download temporário
    const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY || '6f04f2e29amsh46f1b66458e1387p12a0c5jsn0719b3753ea8';
    const rapidApiHost = import.meta.env.VITE_RAPIDAPI_HOST || 'youtube-mp310.p.rapidapi.com';

    const apiUrl = `https://${rapidApiHost}/download/mp3?url=${encodeURIComponent(targetVideoUrl)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': rapidApiHost,
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição RapidAPI: ${response.status} ${response.statusText}`);
    }

    const data: RapidApiMp3Response = await response.json();
    const downloadUrl = data.downloadUrl || data.link || data.url;

    if (!downloadUrl) {
      throw new Error('Propriedade downloadUrl não encontrada na resposta da API.');
    }

    // Passo 2: Baixar o áudio da URL gerada
    const audioResponse = await fetch(downloadUrl);
    if (!audioResponse.ok) {
      throw new Error(`Erro ao baixar o áudio da URL obtida: ${audioResponse.status}`);
    }

    const blob = await audioResponse.blob();

    // Disparar download no navegador sem usar showSaveFilePicker (evita bloqueios de iframe/cross-origin)
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpeza da URL temporária após o clique
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);

    return blob;
  } catch (error) {
    console.error('[RapidAPI YouTube MP3] Falha no processo de download:', error);
    // Verify if it's a key/auth error vs network error
    const errorMessage = error.message || 'Erro desconhecido';
    throw new Error(`RapidAPI YouTube MP3: ${errorMessage}. \n\nSugestão: \n1. Verifique se sua chave VITE_RAPIDAPI_KEY está válida em rapidapi.com \n2. O plano gratuito pode ter limitações de requisições \n3. Alternativa: use links diretos do YouTube ou arquivos locais`);
  }
}
