import React from 'react';
import { Session, Member } from '../types';
import { GlassCard } from './GlassCard';
import { Clock, Music, Users, Sparkles, ChevronRight, Trash2 } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  members: Member[];
  onClick?: () => void;
  onDelete?: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  members,
  onClick,
  onDelete,
}) => {
  const sessionColor = session.color || '#8338ec';

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  const participantMembers = members.filter((m) =>
    session.participants.includes(m.id)
  );

  return (
    <GlassCard
      onClick={onClick}
      className="flex flex-col justify-between p-5 group hover:border-brand-purple/40 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Background subtle color accent glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-15"
        style={{ backgroundColor: sessionColor }}
      />

      <div className="flex flex-col gap-3 relative z-10">
        
        {/* Top Badges & Type */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-3xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${sessionColor}20`,
                color: sessionColor,
                borderColor: `${sessionColor}40`,
              }}
            >
              {session.type === 'planejada' ? 'Planejada' : 'Livre'}
            </span>

            {session.status === 'active' ? (
              <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativa
              </span>
            ) : (
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-brand-text-muted border border-white/10">
                Concluída
              </span>
            )}
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Excluir a sessão "${session.name}"?`)) {
                  onDelete(session.id);
                }
              }}
              className="p-1 rounded-lg hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Excluir sessão"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cover & Title */}
        <div className="flex items-center gap-3.5 mt-1">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner shrink-0"
            style={{
              backgroundColor: `${sessionColor}20`,
              borderColor: `${sessionColor}60`,
            }}
          >
            {session.cover || '🎶'}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-white truncate group-hover:text-brand-purple-light transition-colors">
              {session.name}
            </h3>
            <p className="text-2xs text-brand-text-muted truncate mt-0.5">
              {session.description || `${session.songs?.length || 0} músicas registradas`}
            </p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/30 border border-white/5 text-2xs font-semibold">
          <div className="flex items-center gap-1.5 text-brand-text-muted">
            <Clock className="w-3.5 h-3.5 text-brand-purple-light" />
            <span>{formatDuration(session.duration || 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-text-muted">
            <Music className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{session.songs?.length || 0} faixas</span>
          </div>
        </div>

      </div>

      {/* Footer: Participants & View Action */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-brand-border/40 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center -space-x-1.5">
            {participantMembers.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="w-6 h-6 rounded-full border border-brand-surface flex items-center justify-center text-3xs font-bold"
                style={{ backgroundColor: `${m.color || '#8338ec'}30` }}
              >
                {m.avatar}
              </div>
            ))}
          </div>
          {participantMembers.length > 4 && (
            <span className="text-3xs text-brand-text-muted font-bold">
              +{participantMembers.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-brand-purple-light group-hover:translate-x-1 transition-transform">
          <span>Linha do Tempo</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </GlassCard>
  );
};
