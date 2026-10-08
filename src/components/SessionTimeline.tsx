import React from 'react';
import { SessionTimelineEvent, SessionSong } from '../types';
import {
  Play,
  Pause,
  CheckCircle2,
  Users,
  Sparkles,
  Music,
  Heart,
  Forward,
  Flag,
  Clock,
} from 'lucide-react';

interface SessionTimelineProps {
  timeline: SessionTimelineEvent[];
  songs?: SessionSong[];
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ timeline, songs = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-brand-surface/40 border border-brand-border/60 text-brand-text-muted text-xs font-semibold">
        Nenhum evento registrado nesta linha do tempo ainda.
      </div>
    );
  }

  // Helper to format ISO time to HH:MM:SS
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Icon selector based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />;
      case 'song_start':
        return <Music className="w-4 h-4 text-brand-cyan" />;
      case 'song_end':
        return <CheckCircle2 className="w-4 h-4 text-brand-purple-light" />;
      case 'pause':
        return <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'resume':
        return <Play className="w-4 h-4 text-brand-blue" />;
      case 'participant_add':
      case 'participant_remove':
        return <Users className="w-4 h-4 text-brand-pink" />;
      case 'moment_add':
        return <Sparkles className="w-4 h-4 text-amber-300" />;
      case 'finish':
        return <Flag className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-brand-text-muted" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-purple-light" />
        Linha do Tempo da Sessão ({timeline.length} Eventos)
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border/60">
        {timeline.map((evt, index) => {
          const isStart = evt.type === 'start';
          const isFinish = evt.type === 'finish';
          const isSong = evt.type === 'song_start';
          const isMoment = evt.type === 'moment_add';

          // Find associated song data if available
          const matchingSong = isSong
            ? songs.find((s) => s.title === evt.metadata?.songTitle)
            : null;

          return (
            <div key={evt.id || index} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-[23px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-md transition-all ${
                  isStart || isFinish
                    ? 'bg-emerald-500/20 border-emerald-400'
                    : isMoment
                    ? 'bg-amber-400/20 border-amber-300'
                    : 'bg-brand-surface border-brand-border/80'
                }`}
              >
                {getEventIcon(evt.type)}
              </div>

              {/* Card Event Item */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isMoment
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : isFinish
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : 'bg-brand-card/50 border-brand-border/60 hover:bg-brand-surface/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                    {evt.title}
                    {evt.metadata?.memberAvatar && (
                      <span className="text-sm">{evt.metadata.memberAvatar}</span>
                    )}
                  </h4>
                  <span className="text-3xs font-mono font-semibold text-brand-text-muted shrink-0">
                    {formatTime(evt.timestamp)}
                  </span>
                </div>

                {evt.description && (
                  <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
                    {evt.description}
                  </p>
                )}

                {/* Song Badges / Flags */}
                {matchingSong && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    {matchingSong.listenedTime > 0 && (
                      <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-white/5 text-brand-text-muted">
                        Ouvido: {Math.floor(matchingSong.listenedTime / 60)}m {matchingSong.listenedTime % 60}s
                      </span>
                    )}
                    {matchingSong.skipped && (
                      <span className="text-3xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1">
                        <Forward className="w-3 h-3" /> Pulada
                      </span>
                    )}
                    {matchingSong.favorited && (
                      <span className="text-3xs font-bold px-2 py-0.5 rounded bg-brand-pink/20 text-brand-pink flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" /> Favoritada
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
