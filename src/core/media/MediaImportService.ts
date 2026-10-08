import { Track } from '../../types';
import { ImportMediaOptions, ImportMediaResult, LocalMediaRecord } from './types';
import { mediaStorage } from './MediaStorage';
import { mediaCache } from './MediaCache';

export class MediaImportService {
  private supportedMimeTypes = [
    'audio/mpeg', // mp3
    'audio/mp3',
    'audio/m4a', // m4a
    'audio/x-m4a',
    'audio/aac', // aac
    'audio/wav', // wav
    'audio/x-wav',
    'audio/ogg', // ogg
    'audio/flac', // flac
    'audio/x-flac',
  ];

  /**
   * Import a local audio File into IndexedDB and build a Track object
   */
  public async importAudioFile(
    file: File,
    options: ImportMediaOptions = {}
  ): Promise<ImportMediaResult> {
    if (!this.isFileTypeSupported(file)) {
      throw new Error(`Unsupported audio file type: ${file.type || file.name}`);
    }

    const trackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const blobId = `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Read audio duration
    const duration = await this.readAudioDuration(file);

    // Format metadata
    const parsedName = this.parseFileName(file.name);
    const title = parsedName.title;
    const artist = options.artist || parsedName.artist || 'Local Artist';
    const album = options.album || 'Local Import';

    // Construct local Object URL
    const objectUrl = URL.createObjectURL(file);
    mediaCache.registerObjectUrl(trackId, objectUrl);

    // Create LocalMediaRecord
    const record: LocalMediaRecord = {
      id: `rec_${trackId}`,
      trackId,
      blobId,
      fileBlob: file,
      fileName: file.name,
      size: file.size,
      duration,
      mimeType: file.type || this.inferMimeType(file.name),
      quality: options.quality || '320kbps',
      createdAt: Date.now(),
      lastPlayed: null,
      favorite: options.favorite || false,
      downloads: 1,
      checksum: `${file.name}_${file.size}_${file.lastModified}`,
    };

    // Store in IndexedDB
    await mediaStorage.saveRecord(record);

    // Create Track model configured for Local Source
    const track: Track = {
      id: trackId,
      title,
      artist,
      album,
      duration,
      youtubeId: '',
      source: {
        type: 'local',
        localPath: objectUrl,
        fileSize: file.size,
        mimeType: record.mimeType,
      },
      energyLevel: 50,
      relaxLevel: 50,
      danceLevel: 50,
      focusLevel: 50,
      genre: 'Local',
      moods: ['Custom'],
      addedBy: 'local_user',
      addedAt: new Date().toISOString(),
      playsCount: 0,
    };

    return {
      track,
      record,
      objectUrl,
    };
  }

  /**
   * Check if file type or extension is supported
   */
  public isFileTypeSupported(file: File): boolean {
    if (file.type && this.supportedMimeTypes.includes(file.type.toLowerCase())) {
      return true;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'flac'].includes(ext || '');
  }

  /**
   * Read exact duration of audio file using browser HTMLAudioElement
   */
  private readAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const tempUrl = URL.createObjectURL(file);
      const audio = new Audio();

      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration || 0);
        URL.revokeObjectURL(tempUrl);
        resolve(dur);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(0); // Fallback if metadata read fails
      };

      audio.src = tempUrl;
    });
  }

  /**
   * Infer artist and title from filename (e.g. "Artist - Song.mp3")
   */
  private parseFileName(fileName: string): { title: string; artist: string } {
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim(),
      };
    }

    return {
      artist: 'Local Artist',
      title: nameWithoutExt.trim(),
    };
  }

  private inferMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp3':
        return 'audio/mpeg';
      case 'm4a':
        return 'audio/m4a';
      case 'aac':
        return 'audio/aac';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'flac':
        return 'audio/flac';
      default:
        return 'audio/mpeg';
    }
  }
}

export const mediaImportService = new MediaImportService();
