/**
 * YouTube Link Utilities for NeonFlow
 */

/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/live/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - Plain 11-character ID strings
 */
export const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // If already an 11-character YouTube ID, return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Add protocol if missing to enable native URL parsing
    const urlString = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.replace('www.', '');

    if (hostname === 'youtu.be') {
      return parsed.pathname.substring(1).split(/[?#]/)[0];
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const pathParts = parsed.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'watch') {
        return parsed.searchParams.get('v') || '';
      }
      if (pathParts[0] === 'live') {
        return pathParts[1]?.split(/[?#]/)[0] || '';
      }
      if (pathParts[0] === 'shorts') {
        return pathParts[1]?.split(/[?#]/)[0] || '';
      }
      if (pathParts[0] === 'embed') {
        return pathParts[1]?.split(/[?#]/)[0] || '';
      }
    }
  } catch (e) {
    // If native URL parsing fails, fallback to regex
  }

  // Regex fallback for various formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/|\/live\/)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  return '';
};

/**
 * Validates whether a string is a valid YouTube URL or an 11-character video ID.
 */
export const isValidYoutubeUrl = (url: string): boolean => {
  const id = extractYoutubeId(url);
  return id.length === 11;
};

/**
 * Detects the specific format of the provided YouTube URL.
 */
export const detectYoutubeFormat = (url: string): 'watch' | 'be' | 'live' | 'shorts' | 'id' | 'unknown' => {
  if (!url) return 'unknown';
  const trimmed = url.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return 'id';
  }

  if (trimmed.includes('youtube.com/watch')) return 'watch';
  if (trimmed.includes('youtu.be/')) return 'be';
  if (trimmed.includes('youtube.com/live')) return 'live';
  if (trimmed.includes('youtube.com/shorts')) return 'shorts';

  return 'unknown';
};

/**
 * Generates the medium quality YouTube thumbnail URL for a given video ID.
 */
export const getYoutubeThumbnail = (youtubeId: string): string => {
  if (!youtubeId) return '';
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
};

export interface YoutubeMetadata {
  title: string;
  artist: string;
  thumbnail: string;
  youtubeId: string;
  youtubeUrl: string;
}

/**
 * Sanitizes YouTube video titles by stripping common clutter terms
 * such as (Official Video), [Official Audio], (Lyric Video), [HD], etc.,
 * and separates "Artist - Title" if formatted accordingly.
 */
export const sanitizeYouTubeTitle = (
  rawTitle: string,
  defaultArtist?: string
): { title: string; artist: string } => {
  if (!rawTitle) {
    return { title: 'Música do YouTube', artist: defaultArtist || 'Artista Desconhecido' };
  }

  let title = rawTitle.trim();
  let artist = (defaultArtist || '').replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();

  // Try to separate "Artist - Title" or "Artist – Title" or "Artist : Title" or "Artist | Title"
  const separators = [' - ', ' – ', ' — ', ' : ', ' | '];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      if (parts.length >= 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0) {
        artist = parts[0].trim();
        title = parts.slice(1).join(sep).trim();
        break;
      }
    }
  }

  // Regex patterns to remove YouTube clutter noise
  const clutterRegexes = [
    /\((?:Official|Oficial)\s*(?:Music|Musica)?\s*(?:Video|Vídeo|Audio|Áudio|Live|Clip|Clipe|Visualizer|Lyric|Performance)?\)/gi,
    /\[(?:Official|Oficial)\s*(?:Music|Musica)?\s*(?:Video|Vídeo|Audio|Áudio|Live|Clip|Clipe|Visualizer|Lyric|Performance)?\]/gi,
    /\((?:Vídeo|Video|Áudio|Audio|Clip|Clipe)\s*(?:Oficial|Official)\)/gi,
    /\[(?:Vídeo|Video|Áudio|Audio|Clip|Clipe)\s*(?:Oficial|Official)\]/gi,
    /\((?:Lyric Video|Lyrics|Lyric|Com Letra|Legendado|Letra|Visualizer|Performance|Live|Ao Vivo|Official Video|Official Audio)\)/gi,
    /\[(?:Lyric Video|Lyrics|Lyric|Com Letra|Legendado|Letra|Visualizer|Performance|Live|Ao Vivo|Official Video|Official Audio)\]/gi,
    /\((?:HD|4K|8K|1080p|720p|Full HD|Remastered|Remasterizado|Explicit|Audio Original|High Quality|HQ|MQ)\)/gi,
    /\[(?:HD|4K|8K|1080p|720p|Full HD|Remastered|Remasterizado|Explicit|Audio Original|High Quality|HQ|MQ)\]/gi,
    /\((?:Audio|Video)\)/gi,
    /\[(?:Audio|Video)\]/gi,
  ];

  clutterRegexes.forEach((rgx) => {
    title = title.replace(rgx, '');
    if (artist) {
      artist = artist.replace(rgx, '');
    }
  });

  // Clean quotes and special chars
  title = title.replace(/^["'“«\s]+|["'”»\s]+$/g, '').replace(/\(\s*\)|\[\s*\]/g, '').replace(/\s+/g, ' ').trim();
  if (artist) {
    artist = artist.replace(/^["'“«\s]+|["'”»\s]+$/g, '').replace(/\(\s*\)|\[\s*\]/g, '').replace(/\s+/g, ' ').trim();
  }

  return {
    title: title || rawTitle.trim() || 'Música do YouTube',
    artist: artist || defaultArtist || 'Artista Desconhecido',
  };
};

/**
 * Fetches title, artist/channel, and thumbnail metadata for a YouTube URL or ID using oEmbed.
 */
export const fetchYoutubeMetadata = async (urlOrId: string): Promise<YoutubeMetadata | null> => {
  const ytId = extractYoutubeId(urlOrId);
  if (!ytId || ytId.length !== 11) return null;

  const fullUrl = `https://www.youtube.com/watch?v=${ytId}`;
  const defaultThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(fullUrl)}&format=json`);
    if (response.ok) {
      const data = await response.json();
      const rawTitle = (data.title || '').trim();
      const rawAuthor = (data.author_name || '').trim();

      const sanitized = sanitizeYouTubeTitle(rawTitle, rawAuthor);

      return {
        title: sanitized.title,
        artist: sanitized.artist,
        thumbnail: data.thumbnail_url || defaultThumbnail,
        youtubeId: ytId,
        youtubeUrl: fullUrl,
      };
    }
  } catch (err) {
    console.warn('[youtube] oEmbed fetch error, using fallback:', err);
  }

  return {
    title: `Vídeo do YouTube (${ytId})`,
    artist: 'Canal do YouTube',
    thumbnail: defaultThumbnail,
    youtubeId: ytId,
    youtubeUrl: fullUrl,
  };
};

