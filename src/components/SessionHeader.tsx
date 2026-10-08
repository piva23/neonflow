import React from 'react';
import { Session, Member } from '../types';
import {
  Sparkles,
  Clock,
  Music,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Heart,
  Calendar,
  Layers,
  Gamepad2,
  FileText,
} from 'lucide-react';
import { Button } from './Button';

interface SessionHeaderProps {
  session: Session;
  members: Member[];
  onFinish?: () => void;
  onCancel?: () => void;
  onAddParticipantClick?: () => void;
  onAddMomentClick?: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  members,
  onFinish,
  onCancel,
  onAddParticipantClick,
  onAddMomentClick,
}) => {
  const sessionColor = session.color || '#8338ec';

  // Format duration in minutes / seconds or hours
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  // Participant details
  const participantMembers = members.filter((m) =>
    session.participants.includes(m.id)
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-surface border border-brand-border/80 shadow-2xl p-6 md:p-8 flex flex-col gap-6">
      {/* Background glow flare */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: sessionColor }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        
        {/* Left info: Cover, badges, title, description */}
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl border shadow-xl shrink-0"
            style={{
              backgroundColor: `${sessionColor}25`,
              borderColor: `${sessionColor}80`,
            }}
          >
            {session.cover || '🎶'}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-3xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${sessionColor}20`,
                  color: sessionColor,
                  borderColor: `${sessionColor}50`,
                }}
              >
                Sessão {session.type === 'planejada' ? 'Planejada' : 'Livre'}
              </span>

              {session.status === 'active' ? (
                <span className="text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Em Andamento
                </span>
              ) : (
                <span className="text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-brand-text-muted border border-white/20">
                  Concluída
                </span>
              )}

              {session.mood && (
                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-brand-text-muted border border-white/10">
                  Mood: {session.mood}
                </span>
              )}

              {session.controllerName && (
                <span className="text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" />
                  Controlador: {session.controllerName}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white font-display tracking-tight leading-tight">
              {session.name}
            </h1>

            {session.description && (
              <p className="text-xs text-brand-text-muted max-w-xl font-medium leading-relaxed">
                {session.description}
              </p>
            )}

            {session.notes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2 max-w-xl my-1">
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-3xs font-medium leading-relaxed">
                  <strong className="font-bold text-amber-300">Obs:</strong> {session.notes}
                </p>
              </div>
            )}

            {/* Quick stats row */}
            <div className="flex items-center gap-4 text-xs font-bold text-brand-text-muted mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-purple-light" />
                {formatDuration(session.duration || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-brand-cyan" />
                {session.songs?.length || 0} músicas
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-pink" />
                {new Date(session.startedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions & status */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {session.status === 'active' && onFinish && (
            <Button onClick={onFinish} variant="primary" glow size="md">
              <CheckCircle2 className="w-4 h-4" /> Finalizar Sessão
            </Button>
          )}

          {session.status === 'active' && onAddMomentClick && (
            <Button onClick={onAddMomentClick} variant="secondary" size="md">
              <Sparkles className="w-4 h-4 text-brand-pink" /> Momento
            </Button>
          )}

          {session.status === 'active' && onCancel && (
            <Button onClick={onCancel} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
              <XCircle className="w-4 h-4" /> Cancelar
            </Button>
          )}
        </div>

      </div>

      {/* Participants Bar */}
      <div className="pt-4 border-t border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-purple-light" />
            Participantes ({participantMembers.length}):
          </span>

          <div className="flex items-center -space-x-2">
            {participantMembers.map((m) => (
              <div
                key={m.id}
                title={`${m.name} (${m.role})`}
                className="w-8 h-8 rounded-full border-2 border-brand-surface flex items-center justify-center text-xs font-bold shadow-md"
                style={{ backgroundColor: `${m.color || '#8338ec'}30` }}
              >
                {m.avatar}
              </div>
            ))}
          </div>
        </div>

        {session.status === 'active' && onAddParticipantClick && (
          <button
            onClick={onAddParticipantClick}
            className="text-xs font-bold text-brand-purple-light hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar / Remover Integrantes
          </button>
        )}
      </div>

    </div>
  );
};
