import { sanitizeYouTubeTitle } from '../utils/youtube';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
}

/**
 * Searches YouTube for videos based on user query string.
 * Consumes the YouTube V2 RapidAPI endpoint: GET https://youtube-v2.p.rapidapi.com/search/?query={termo}
 */
export async function searchYouTube(
  query: string,
  limit: number = 12
): Promise<YouTubeSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if user pasted a direct YouTube URL or video ID
  const urlMatch = trimmed.match(
    /(?:v=|\/embed\/|\/1080\/|\/shorts\/|youtu\.be\/|\/v\/)([^"&?\/\s]{11})/
  );
  if (urlMatch && urlMatch[1]) {
    const videoId = urlMatch[1];
    return [
      {
        videoId,
        title: 'Música do YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channelName: 'YouTube',
      },
    ];
  }

  const rapidApiKey =
    import.meta.env.VITE_RAPIDAPI_KEY || '6f04f2e29amsh46f1b66458e1387p12a0c5jsn0719b3753ea8';
  const rapidApiHost = 'youtube-v2.p.rapidapi.com';

  // 1. Primary Search Attempt via RapidAPI YouTube V2
  try {
    const searchUrl = `https://${rapidApiHost}/search/?query=${encodeURIComponent(trimmed)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': rapidApiHost,
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const rawList =
        data.videos || data.items || data.results || data.contents || (Array.isArray(data) ? data : []);

      if (Array.isArray(rawList) && rawList.length > 0) {
        const results: YouTubeSearchResult[] = [];

        for (const item of rawList) {
          const videoId =
            item.video_id ||
            item.videoId ||
            item.id ||
            (typeof item.video === 'object' ? item.video?.videoId : '') ||
            '';

          if (!videoId) continue;

          const rawTitle = item.title || item.snippet?.title || 'Música do YouTube';
          const channel =
            item.author?.title ||
            item.author?.name ||
            item.channel_name ||
            item.channelTitle ||
            item.snippet?.channelTitle ||
            item.author ||
            'YouTube';

          const sanitized = sanitizeYouTubeTitle(rawTitle, channel);

          const thumb =
            item.thumbnails?.[0]?.url ||
            item.thumbnails?.high?.url ||
            item.thumbnail ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

          results.push({
            videoId,
            title: sanitized.title || rawTitle,
            thumbnail: thumb,
            channelName: sanitized.artist || channel,
          });

          if (results.length >= limit) break;
        }

        if (results.length > 0) {
          return results;
        }
      }
    } else {
      console.warn('[youtubeSearchService] RapidAPI YouTube V2 returned status:', response.status);
    }
  } catch (err) {
    console.warn('[youtubeSearchService] Error calling RapidAPI YouTube V2:', err);
    // Key may be expired/invalid - fallback handled below
  }

  // RapidAPI key expired or invalid - inform user
  if (!import.meta.env.VITE_RAPIDAPI_KEY) {
    // Will show friendly message in component if no results returned
  }

  // 2. Secondary Fallback: Official YouTube Data API v3 if key available
  const googleApiKey = import.meta.env.VITE_YOUTUBE_SEARCH_API_KEY;
  if (googleApiKey) {
    try {
      const googleUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(
        trimmed
      )}&key=${googleApiKey}`;
      const res = await fetch(googleUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          return data.items
            .map((item: any) => {
              const videoId = item.id?.videoId || '';
              const rawTitle = item.snippet?.title || 'Vídeo do YouTube';
              const channel = item.snippet?.channelTitle || 'YouTube';
              const sanitized = sanitizeYouTubeTitle(rawTitle, channel);
              const thumb =
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              return {
                videoId,
                title: sanitized.title,
                thumbnail: thumb,
                channelName: sanitized.artist || channel,
              };
            })
            .filter((item: YouTubeSearchResult) => Boolean(item.videoId));
        }
      }
    } catch (gErr) {
      console.warn('[youtubeSearchService] Google YouTube API error:', gErr);
    }
  }

  return [];
}
