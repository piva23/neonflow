import React from 'react';
import { Member } from '../types';
import { useMember } from '../hooks';
import { Plus, Check, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface MemberSelectorProps {
  variant?: 'compact' | 'netflix' | 'banner';
  onAddMemberClick?: () => void;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  variant = 'netflix',
  onAddMemberClick,
}) => {
  const { members, activeMember, selectMember } = useMember();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {members.map((member) => {
          const isActive = activeMember?.id === member.id;
          return (
            <button
              key={member.id}
              onClick={() => selectMember(member.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                selectMember(member.id);
              }}
              className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-brand-purple/20 border-brand-purple text-white shadow-md shadow-brand-purple/20'
                  : 'bg-black/30 border-brand-border/40 text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{member.avatar}</span>
              <span>{member.name}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              )}
            </button>
          );
        })}
        {onAddMemberClick && (
          <button
            onClick={onAddMemberClick}
            className="p-1.5 rounded-xl bg-white/5 border border-brand-border/40 text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Adicionar Membro"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-purple-light" />
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted">
            Troca de Membro Rápida ("Quem está ouvindo?")
          </h3>
        </div>
        <span className="text-3xs font-semibold text-brand-text-muted">
          Clique para alternar toda a interface
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {members.map((member) => {
          const isActive = activeMember?.id === member.id;
          const memberColor = member.color || '#8338ec';

          return (
            <motion.button
              key={member.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => selectMember(member.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                selectMember(member.id);
              }}
              className={`flex flex-col items-center justify-between p-4 min-h-[120px] rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden text-center active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-brand-card/90 to-brand-surface/90 border-brand-purple shadow-xl shadow-brand-purple/25 ring-2 ring-brand-purple/50'
                  : 'bg-brand-card/40 border-brand-border/60 hover:border-white/30 hover:bg-brand-surface/40'
              }`}
            >
              {/* Active Badge Marker */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Avatar Circle with Glow */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg my-1 select-none transition-transform duration-300 ${
                  isActive ? 'scale-110 shadow-brand-purple/40' : 'group-hover:scale-105'
                }`}
                style={{
                  backgroundColor: `${memberColor}25`,
                  border: `2px solid ${memberColor}`,
                }}
              >
                {member.avatar}
              </div>

              {/* Info */}
              <div className="mt-2 w-full">
                <h4 className={`text-sm font-black truncate leading-tight ${isActive ? 'text-white' : 'text-brand-text'}`}>
                  {member.name}
                </h4>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span
                    className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${memberColor}15`,
                      color: memberColor,
                      borderColor: `${memberColor}40`,
                    }}
                  >
                    {member.role}
                  </span>
                  <span className="text-3xs font-mono font-bold text-brand-text-muted">
                    Lvl {member.level || 1}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}

        {onAddMemberClick && (
          <button
            onClick={onAddMemberClick}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-dashed border-brand-border/80 hover:border-brand-purple/80 bg-brand-card/20 hover:bg-brand-purple/10 text-brand-text-muted hover:text-white transition-all cursor-pointer min-h-[120px] group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-2xs font-extrabold uppercase tracking-wider mt-1">
              + Adicionar
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
