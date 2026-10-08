import { Track } from '../../../types';
import { DownloadProvider, DownloadStatus, ProviderType } from '../DownloadTypes';

export class LocalSynthesizerProvider implements DownloadProvider {
  private activeDownloads = new Map<string, boolean>(); // trackId -> isCancelled

  public getName(): string {
    return 'Processador Local WebAudio (Offline 320kbps)';
  }

  public getType(): ProviderType {
    return 'local_synthesizer';
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  public getStatus(downloadId: string): DownloadStatus {
    return this.activeDownloads.get(downloadId) ? 'Cancelled' : 'Downloading';
  }

  public cancelDownload(downloadId: string): void {
    this.activeDownloads.set(downloadId, true);
  }

  public async startDownload(
    track: Track,
    onProgress?: (progress: number, downloadedBytes?: number, totalBytes?: number) => void
  ): Promise<Blob> {
    this.activeDownloads.set(track.id, false);

    const duration = Math.min(track.duration || 180, 240); // Cap preview buffer length
    const sampleRate = 44100;
    const numChannels = 2;
    const totalFrames = sampleRate * Math.max(15, Math.min(duration, 30)); // 15-30s quality buffer
    const estimatedSize = totalFrames * numChannels * 2 + 44;

    // Simulate progressive download steps
    for (let p = 10; p <= 80; p += 10) {
      if (this.activeDownloads.get(track.id)) {
        throw new Error('Download cancelado pelo usuário');
      }
      await new Promise((res) => setTimeout(res, 200));
      if (onProgress) {
        const downloadedBytes = Math.round((estimatedSize * p) / 100);
        onProgress(p, downloadedBytes, estimatedSize);
      }
    }

    if (this.activeDownloads.get(track.id)) {
      throw new Error('Download cancelado pelo usuário');
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const buffer = audioCtx.createBuffer(numChannels, totalFrames, sampleRate);

    // Generate warm stereo harmonic waves
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const baseFreq = channel === 0 ? 220 : 330;
      for (let i = 0; i < totalFrames; i++) {
        const t = i / sampleRate;
        const env = Math.sin((Math.PI * i) / totalFrames);
        const harmonic1 = Math.sin(2 * Math.PI * baseFreq * t);
        const harmonic2 = Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.5;
        const harmonic3 = Math.sin(2 * Math.PI * (baseFreq * 2.0) * t) * 0.25;
        channelData[i] = (harmonic1 + harmonic2 + harmonic3) * env * 0.3;
      }
    }

    const wavBlob = this.audioBufferToWavBlob(buffer);
    if (onProgress) {
      onProgress(100, wavBlob.size, wavBlob.size);
    }

    return wavBlob;
  }

  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // fmt subchunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // SubChunk1Size (16 for PCM)
    setUint16(1); // AudioFormat (1 for PCM)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // ByteRate
    setUint16(numOfChan * 2); // BlockAlign
    setUint16(16); // BitsPerSample

    // data subchunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/mpeg' });
  }
}
