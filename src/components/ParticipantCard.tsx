import React from 'react';
import { Member, ParticipantStatus } from '../types';
import { UserCheck, UserMinus, Plus, UserPlus } from 'lucide-react';

interface ParticipantCardProps {
  member: Member;
  status?: ParticipantStatus;
  isParticipating?: boolean;
  onToggle?: (memberId: string) => void;
  onRemove?: (memberId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  member,
  status = 'participando',
  isParticipating = true,
  onToggle,
  onRemove,
  size = 'md',
}) => {
  const memberColor = member.color || '#8338ec';

  const statusBadges = {
    participando: { label: 'Participando', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    ausente: { label: 'Ausente', bg: 'bg-white/10 text-brand-text-muted border-white/20' },
    convidado: { label: 'Convidado', bg: 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/40' },
  };

  const currentBadge = statusBadges[status] || statusBadges.participando;

  if (size === 'sm') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all ${
          isParticipating
            ? 'bg-white/10 text-white border-white/20'
            : 'bg-black/20 text-brand-text-muted border-transparent opacity-60'
        }`}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-2xs border shrink-0"
          style={{ backgroundColor: `${memberColor}25`, borderColor: `${memberColor}80` }}
        >
          {member.avatar}
        </span>
        <span className="truncate max-w-[80px]">{member.name}</span>
        {onRemove && isParticipating && (
          <button
            onClick={() => onRemove(member.id)}
            className="hover:text-red-400 p-0.5 rounded transition-colors"
            title="Remover participante"
          >
            <UserMinus className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
        isParticipating
          ? 'bg-brand-card/70 border-brand-purple/30 text-white shadow-sm'
          : 'bg-black/20 border-brand-border/40 text-brand-text-muted hover:border-brand-border/80'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
          style={{
            backgroundColor: `${memberColor}20`,
            borderColor: `${memberColor}80`,
          }}
        >
          {member.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-extrabold text-white truncate">{member.name}</h4>
            <span
              className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border shrink-0"
              style={{
                backgroundColor: `${memberColor}15`,
                color: memberColor,
                borderColor: `${memberColor}40`,
              }}
            >
              {member.role}
            </span>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${currentBadge.bg}`}>
              {currentBadge.label}
            </span>
          </div>
          <span className="text-3xs text-brand-text-muted font-semibold">
            {status === 'participando' ? 'No momento ouvindo' : status === 'convidado' ? 'Convidado especial' : 'Ausente na sessão'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onToggle && (
          <button
            onClick={() => onToggle(member.id)}
            className={`px-2.5 py-1 rounded-xl text-3xs font-extrabold border transition-all flex items-center gap-1 cursor-pointer ${
              isParticipating
                ? 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                : 'bg-white/5 text-brand-text-muted border-white/10 hover:bg-brand-purple hover:text-white'
            }`}
          >
            {isParticipating ? (
              <>
                <UserCheck className="w-3 h-3" /> Na Sessão
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> Adicionar
              </>
            )}
          </button>
        )}

        {onRemove && !onToggle && (
          <button
            onClick={() => onRemove(member.id)}
            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            title="Remover da sessão"
          >
            <UserMinus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
