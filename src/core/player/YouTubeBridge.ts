import { playerEvents } from './PlayerEvents';

export class YouTubeBridge {
  private static instance: YouTubeBridge | null = null;
  private ytPlayer: any = null;
  private isPlayerReady: boolean = false;
  private containerId: string = 'neonflow-youtube-iframe-element';
  private checkInterval: any = null;

  private constructor() {}

  public static getInstance(): YouTubeBridge {
    if (!YouTubeBridge.instance) {
      YouTubeBridge.instance = new YouTubeBridge();
    }
    return YouTubeBridge.instance;
  }

  public init(containerId?: string): Promise<void> {
    if (containerId) {
      this.containerId = containerId;
    }

    if (this.isPlayerReady && this.ytPlayer) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const win = window as any;

      // Load YouTube IFrame API script if missing
      if (!win.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(tag, firstScript);
        } else {
          document.head.appendChild(tag);
        }
      }

      const createPlayer = () => {
        if (win.YT && win.YT.Player) {
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }

          const container = document.getElementById(this.containerId);
          if (!container) {
            console.warn(`[YouTubeBridge] Container element #${this.containerId} not found in DOM yet.`);
            return;
          }

          // If instance already created, don't recreate
          if (this.ytPlayer) {
            this.isPlayerReady = true;
            playerEvents.emit('playerReadyChange', true);
            resolve();
            return;
          }

          try {
            this.ytPlayer = new win.YT.Player(this.containerId, {
              height: '100%',
              width: '100%',
              videoId: '',
              playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                origin: window.location.origin,
                playsinline: 1,
                enablejsapi: 1,
              },
              events: {
                onReady: (event: any) => {
                  this.isPlayerReady = true;
                  playerEvents.emit('playerReadyChange', true);
                  resolve();
                },
                onStateChange: (event: any) => {
                  // win.YT.PlayerState.ENDED is 0
                  // win.YT.PlayerState.PLAYING is 1
                  // win.YT.PlayerState.PAUSED is 2
                  if (event.data === 0) {
                    playerEvents.emit('playbackStateChange', false);
                    playerEvents.emit('trackEnded');
                  } else if (event.data === 1) {
                    playerEvents.emit('playbackStateChange', true);
                  } else if (event.data === 2) {
                    playerEvents.emit('playbackStateChange', false);
                  }
                },
                onError: (error: any) => {
                  console.error('[YouTubeBridge] YT Player Error:', error);
                  playerEvents.emit('error', error);
                },
              },
            });
          } catch (err) {
            console.error('[YouTubeBridge] Failed to create YT Player instance:', err);
          }
        }
      };

      if (win.YT && win.YT.Player) {
        createPlayer();
      } else {
        this.checkInterval = setInterval(() => {
          if (win.YT && win.YT.Player) {
            createPlayer();
          }
        }, 300);
      }
    });
  }

  public isReady(): boolean {
    return this.isPlayerReady && Boolean(this.ytPlayer);
  }

  public loadVideoById(youtubeId: string, startSeconds: number = 0): void {
    if (!youtubeId) return;

    const play = () => {
      try {
        if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
          this.ytPlayer.loadVideoById({
            videoId: youtubeId,
            startSeconds,
          });
        }
      } catch (err) {
        console.error('[YouTubeBridge] Error in loadVideoById:', err);
      }
    };

    if (this.isReady()) {
      play();
    } else {
      this.init().then(() => play());
    }
  }

  public playVideo(): void {
    if (this.isReady() && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.playVideo();
      } catch (err) {
        console.error('[YouTubeBridge] Error in playVideo:', err);
      }
    }
  }

  public pauseVideo(): void {
    if (this.isReady() && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch (err) {
        console.error('[YouTubeBridge] Error in pauseVideo:', err);
      }
    }
  }

  public stopVideo(): void {
    if (this.isReady() && typeof this.ytPlayer.stopVideo === 'function') {
      try {
        this.ytPlayer.stopVideo();
      } catch (err) {
        console.error('[YouTubeBridge] Error in stopVideo:', err);
      }
    }
  }

  public seekTo(seconds: number): void {
    if (this.isReady() && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(seconds, true);
      } catch (err) {
        console.error('[YouTubeBridge] Error in seekTo:', err);
      }
    }
  }

  public setVolume(volume: number): void {
    if (this.isReady() && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(volume);
      } catch (err) {
        console.error('[YouTubeBridge] Error in setVolume:', err);
      }
    }
  }

  public getCurrentTime(): number {
    if (this.isReady() && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        return this.ytPlayer.getCurrentTime() || 0;
      } catch (err) {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.isReady() && typeof this.ytPlayer.getDuration === 'function') {
      try {
        return this.ytPlayer.getDuration() || 0;
      } catch (err) {
        return 0;
      }
    }
    return 0;
  }
}

export const youtubeBridge = YouTubeBridge.getInstance();
