import React from 'react';
import { Member } from '../types';
import { useMember } from '../hooks';
import { GlassCard } from './GlassCard';
import { Edit3, Trash2, CheckCircle2, Clock, Music, Calendar, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ICON_MAP } from './AvatarSelector';
import { ProfileViewModel } from '../core/progression/viewModels/ProfileViewModel';

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onRemove: (memberId: string) => void;
  onMove?: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onEdit,
  onRemove,
  onMove,
}) => {
  const { activeMember, selectMember } = useMember();
  const isActive = activeMember?.id === member.id;
  const memberColor = member.color || '#3a86ff';

  const profileData = ProfileViewModel.getProfileData(member.id);
  const xpProgress = profileData.xpPercentage;

  const listenTimeHours = Math.floor((profileData.totalMinutesListened || member.statistics?.listenTime || member.listenTime || 0) / 60);
  const listenTimeMins = (profileData.totalMinutesListened || member.statistics?.listenTime || member.listenTime || 0) % 60;

  const renderAvatar = () => {
    const avatar = member.avatar || '🎧';
    if (avatar.startsWith('http')) {
      return (
        <img
          src={avatar}
          alt={member.name}
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            // Fallback to emoji on image load failure
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
          style={{ aspectRatio: '1 / 1' }}
        />
      );
    }
    if (avatar.startsWith('icon:')) {
      const name = avatar.replace('icon:', '');
      const IconComponent = ICON_MAP[name] || Music;
      return <span className="w-7 h-7 inline-flex"><IconComponent className="w-7 h-7" style={{ color: memberColor } as React.CSSProperties} /></span>;
    }
    return <span className="text-3xl leading-none">{avatar}</span>;
  };

  const renderAvatarWithFallback = () => {
    const avatar = member.avatar || '🎧';
    return (
      <>
        {renderAvatar()}
        {avatar.startsWith('http') && (
          <span
            className="absolute inset-0 w-full h-full flex items-center justify-center text-3xl"
            style={{ display: 'none' }}
          >
            🎧
          </span>
        )}
      </>
    );
  };

  return (
    <GlassCard
      className={`relative overflow-hidden flex flex-col justify-between p-5 transition-all duration-300 group ${
        isActive
          ? 'border-brand-purple ring-2 ring-brand-purple/40 bg-gradient-to-br from-brand-card/90 via-brand-surface/80 to-brand-card/90 shadow-xl shadow-brand-purple/20'
          : 'hover:border-white/20'
      }`}
    >
      {/* Background Accent Gradient */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: memberColor }}
      />

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 relative z-10 mb-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 select-none overflow-hidden relative"
            style={{
              backgroundColor: `${memberColor}20`,
              border: `2px solid ${memberColor}`,
            }}
          >
            {renderAvatarWithFallback()}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${memberColor}15`,
                  color: memberColor,
                  borderColor: `${memberColor}40`,
                }}
              >
                {member.role}
              </span>
              {isActive && (
                <span className="text-3xs font-bold text-brand-cyan flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativo
                </span>
              )}
            </div>

            <h3 className="text-base font-extrabold text-white truncate font-display">
              {member.name}
            </h3>

            {member.birthday && (
              <span className="text-3xs text-brand-text-muted flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-brand-text-muted" />
                {member.birthday}
              </span>
            )}
          </div>
        </div>

        {/* Edit/Move/Delete Actions */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {onMove && (
            <button
              onClick={() => onMove(member)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-brand-cyan transition-colors cursor-pointer"
              title="Mover Membro de Família"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(member)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
            title="Editar Membro"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(member.id)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-brand-text-muted hover:text-rose-400 transition-colors cursor-pointer"
            title="Remover Membro"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Level & XP Progress Bar */}
      <div className="flex flex-col gap-1.5 mb-4 p-2.5 rounded-xl bg-black/30 border border-brand-border/40 relative z-10">
        <div className="flex items-center justify-between text-3xs font-extrabold uppercase tracking-wider">
          <span className="text-brand-text-muted">Nível {profileData.level} ({profileData.levelTitle})</span>
          <span className="text-white font-mono">{profileData.totalXp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full"
            style={{ backgroundColor: memberColor }}
          />
        </div>
      </div>

      {/* Favorite Genres Chips */}
      {member.favoriteGenres && member.favoriteGenres.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4 relative z-10">
          {member.favoriteGenres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="text-3xs font-semibold px-2 py-0.5 rounded-md bg-white/5 text-brand-text-muted border border-brand-border/40"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Member Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-2xs font-bold pt-3 border-t border-brand-border/40 relative z-10 mb-4">
        <div className="flex items-center gap-1.5 text-brand-text-muted">
          <Clock className="w-3.5 h-3.5 text-brand-cyan" />
          <span>{listenTimeHours}h {listenTimeMins}m ouvidos</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-text-muted justify-end">
          <Music className="w-3.5 h-3.5 text-brand-purple-light" />
          <span>{member.statistics?.totalFavorites || 0} favoritas</span>
        </div>
      </div>

      {/* Select Active Member Button */}
      {!isActive ? (
        <button
          onClick={() => selectMember(member.id)}
          className="w-full py-2 rounded-xl bg-white/5 hover:bg-brand-purple hover:text-white border border-brand-border/60 text-xs font-bold text-brand-text transition-all cursor-pointer relative z-10"
        >
          Alternar para este perfil
        </button>
      ) : (
        <div className="w-full py-2 rounded-xl bg-brand-purple/20 border border-brand-purple/50 text-xs font-bold text-brand-purple-light text-center relative z-10">
          Perfil Ativo Agora
        </div>
      )}
    </GlassCard>
  );
};
