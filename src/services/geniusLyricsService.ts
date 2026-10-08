/**
 * Serviço de Integração - Genius API v3 (via RapidAPI)
 *
 * Fluxo em 2 passos:
 * 1. Buscar o ID da música pelo título (limpo agressivamente)
 * 2. Buscar a letra completa da música pelo ID obtido
 *
 * Headers especiais desta API:
 * - 'x-api-key': 'thekanjutos' (chave nativa da API Genius v3 no RapidAPI)
 * - 'x-rapidapi-host': host do RapidAPI
 * - 'x-rapidapi-key': chave do usuário no RapidAPI
 *
 * Diagnóstico automático: erros HTTP são traduzidos em mensagens amigáveis
 * que aparecem direto na interface, sem precisar abrir o console.
 */

const GENIUS_API_KEY = 'thekanjutos';

export interface GeniusSearchResult {
  id: number;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
}

export interface GeniusLyricsResponse {
  lyrics: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
}

// ============================================================================
// LIMPEZA AGRESSIVA DE TÍTULOS
// ============================================================================

/**
 * Remove termos que poluem a busca no Genius.
 *
 * Estratégia: cortar a string no primeiro delimitador encontrado entre:
 *   - " - " (seguido de "Topic", "Official", etc.)
 *   - " | " (separador de playlists)
 *   - "(Official", "(Live", "(Ao Vivo", "[Official"
 *   - "feat.", "ft."
 *
 * Exemplos:
 *   "Ed Sheeran - Shape of You [Official Video]"      → "Shape of You"
 *   "Calvin Harris - Feels (Lyric Video) ft. Pharrell" → "Feels"
 *   "Alok & Bruno Martini - Wild Kids (Ao Vivo)"       → "Wild Kids"
 *   "Post Malone - Rockstar ft. 21 Savage [HD]"        → "Rockstar"
 *   "The Weeknd | Blinding Lights (Official Video)"     → "Blinding Lights"
 *   "Bad Guy - Billie Eilish - Topic"                  → "Bad Guy"
 */
function cleanTitleForSearch(title: string): string {
  let cleaned = title;

  // ── Passo 1: Cortar no primeiro delimitador forte ──────────────────────
  // " - Topic", " - Official", " | ", " (Official", " [Official"
  cleaned = cleaned
    .replace(/\s*-\s*Topic\s*$/i, '')
    .replace(/\s*-\s*Official\b.*$/i, '')
    .replace(/\s*\|\s.*$/, '')
    .replace(/\s*\(Official\b.*$/i, '')
    .replace(/\s*\[Official\b.*$/i, '');

  // ── Passo 2: Remover feat./ft. e tudo que vem depois ───────────────────
  cleaned = cleaned.replace(/\s*(?:ft\.?|feat\.?|Feat\.?|FT\.?)\s+.*/i, '');

  // ── Passo 3: Remover parênteses com termos de vídeo/live ───────────────
  cleaned = cleaned.replace(
    /\s*\((?:official\s*(?:video|audio|music)?|live|music\s*video|lyric\s*video|visualizer|performance|acoustic|remix|edit|version|ao\s*vivo|clipe|oficial)\)/gi,
    ''
  );

  // ── Passo 4: Remover colchetes com qualquer conteúdo ───────────────────
  cleaned = cleaned.replace(/\[.*?\]/g, '');

  // ── Passo 5: Remover caracteres especiais residuais ────────────────────
  cleaned = cleaned.replace(/[#!@]/g, '');

  // ── Passo 6: Limpar espaços extras e bordas ────────────────────────────
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

// ============================================================================
// DIAGNÓSTICO HTTP ESPECÍFICO
// ============================================================================

/**
 * Traduz código HTTP em mensagem de diagnóstico amigável.
 * O usuário vê isso direto na tela, sem abrir o console.
 */
function httpStatusToMessage(status: number, context: string): string {
  switch (status) {
    case 403:
      return `Erro 403: Você precisa assinar o plano Basic (gratuito) da Genius API v3 no site do RapidAPI. Acesse rapidapi.com e ative o plano "Genius API v3".`;
    case 404:
      return `Letra não encontrada para '${context}'. Tente buscar com outro título ou artista.`;
    case 429:
      return `Limite de requisições atingido (429). Aguarde alguns minutos e tente novamente.`;
    case 401:
      return `Erro 401: Chaves de API inválidas ou expiradas. Verifique VITE_GENIUS_RAPIDAPI_KEY no .env.`;
    case 500:
    case 502:
    case 503:
      return `Erro ${status}: Servidor do Genius indisponível. Tente novamente em alguns instantes.`;
    default:
      return `Erro HTTP ${status} na ${context}. Verifique sua conexão e tente novamente.`;
  }
}

// ============================================================================
// FUNÇÕES DE BUSCA
// ============================================================================

/**
 * Busca uma música no Genius pelo título.
 * Retorna o primeiro resultado mais relevante ou null se não encontrar.
 */
async function searchSong(title: string, artist?: string): Promise<GeniusSearchResult | null> {
  const host = import.meta.env.VITE_GENIUS_RAPIDAPI_HOST || 'genius-api3.p.rapidapi.com';
  const apiKey = import.meta.env.VITE_GENIUS_RAPIDAPI_KEY || import.meta.env.VITE_RAPIDAPI_KEY || '';

  const cleanedTitle = cleanTitleForSearch(title);
  const query = artist ? `${cleanedTitle} ${artist}` : cleanedTitle;

  const url = `https://${host}/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': GENIUS_API_KEY,
      'x-rapidapi-host': host,
      'x-rapidapi-key': apiKey,
    },
  });

  // ── Diagnóstico HTTP antes de parsear JSON ──────────────────────────────
  if (!response.ok) {
    const errorMsg = httpStatusToMessage(response.status, 'busca da música');
    throw new Error(errorMsg);
  }

  const data = await response.json();

  // A API pode retornar diferentes formatos dependendo da versão
  const hits = data?.response?.hits || data?.hits || data?.results || [];

  if (hits.length === 0) {
    throw new Error(`Letra não encontrada para '${cleanedTitle}'. Tente buscar com outro título ou artista.`);
  }

  // Pegar o primeiro hit mais relevante
  const firstHit = hits[0]?.result || hits[0];

  return {
    id: firstHit.id,
    title: firstHit.title || cleanedTitle,
    artist: firstHit.primary_artist?.name || firstHit.artist || artist || 'Artista Desconhecido',
    thumbnail: firstHit.song_art_image_thumbnail_url || firstHit.thumbnail || '',
    url: firstHit.url || '',
  };
}

/**
 * Busca a letra completa de uma música pelo ID do Genius.
 */
async function fetchLyricsById(songId: number): Promise<string> {
  const host = import.meta.env.VITE_GENIUS_RAPIDAPI_HOST || 'genius-api3.p.rapidapi.com';
  const apiKey = import.meta.env.VITE_GENIUS_RAPIDAPI_KEY || import.meta.env.VITE_RAPIDAPI_KEY || '';

  const url = `https://${host}/songs/${songId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': GENIUS_API_KEY,
      'x-rapidapi-host': host,
      'x-rapidapi-key': apiKey,
    },
  });

  // ── Diagnóstico HTTP antes de parsear JSON ──────────────────────────────
  if (!response.ok) {
    const errorMsg = httpStatusToMessage(response.status, 'busca da letra');
    throw new Error(errorMsg);
  }

  const data = await response.json();

  // A API pode retornar a letra em diferentes campos
  const lyrics =
    data?.response?.song?.lyrics?.plain ||
    data?.lyrics?.plain ||
    data?.lyrics ||
    data?.response?.lyrics ||
    '';

  if (!lyrics || lyrics.trim().length === 0) {
    throw new Error('LETRAS_NAO_ENCONTRADAS');
  }

  return lyrics.trim();
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Busca a letra de uma música pelo título.
 *
 * @param title - Título da música (será limpo agressivamente)
 * @param artist - Nome do artista (opcional, melhora a precisão)
 * @returns Objeto com a letra, título limpo, artista e thumbnail
 */
export async function getSongLyrics(
  title: string,
  artist?: string
): Promise<GeniusLyricsResponse> {
  const cleanedTitle = cleanTitleForSearch(title);

  try {
    // Passo 1: Buscar o ID da música
    const searchResult = await searchSong(title, artist);

    if (!searchResult) {
      return {
        lyrics: '',
        title: cleanedTitle,
        artist: artist || 'Artista Desconhecido',
        thumbnail: '',
        url: '',
      };
    }

    // Passo 2: Buscar a letra pelo ID
    const lyrics = await fetchLyricsById(searchResult.id);

    return {
      lyrics,
      title: searchResult.title,
      artist: searchResult.artist,
      thumbnail: searchResult.thumbnail,
      url: searchResult.url,
    };
  } catch (error) {
    // Re-throw com a mensagem já amigável do diagnóstico
    // O PlayerShell vai capturar e exibir na tela
    throw error;
  }
}

/**
 * Verifica se a API do Genius está configurada e acessível.
 */
export function isGeniusApiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GENIUS_RAPIDAPI_KEY || import.meta.env.VITE_RAPIDAPI_KEY;
  return Boolean(apiKey && apiKey.length > 0);
}
