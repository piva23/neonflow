import React from 'react';
import { Family, Member } from '../types';
import { Button } from './Button';
import { Users, Plus, ShieldCheck, HeartHandshake } from 'lucide-react';

interface FamilyHeaderProps {
  family: Family;
  activeMember: Member | null;
  onAddMember: () => void;
  onCreateFamily: () => void;
}

export const FamilyHeader: React.FC<FamilyHeaderProps> = ({
  family,
  activeMember,
  onAddMember,
  onCreateFamily,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-card via-brand-surface to-brand-card border border-brand-border/80 shadow-2xl relative overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-light flex items-center justify-center text-2xl shadow-lg shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-3xs font-black uppercase tracking-widest text-brand-purple-light flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand-cyan" />
              Gestão de Famílias
            </span>
            <span className="w-1 h-1 bg-brand-text-muted rounded-full" />
            <span className="text-3xs font-bold text-brand-text-muted">
              {family.members?.length || 0} Membros
            </span>
          </div>

          <h1 className="text-2xl font-black font-display text-white tracking-tight">
            {family.name || family.familyName}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative z-10 shrink-0 flex-wrap">
        {activeMember && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/40 border border-brand-border/60 text-xs">
            <span className="text-base">{activeMember.avatar}</span>
            <div className="flex flex-col">
              <span className="text-3xs font-extrabold text-brand-text-muted uppercase">Membro Ativo</span>
              <span className="font-bold text-white leading-none">{activeMember.name}</span>
            </div>
          </div>
        )}

        <Button onClick={onAddMember} variant="primary" size="sm" glow>
          <Plus className="w-4 h-4" /> Adicionar Membro
        </Button>

        <Button onClick={onCreateFamily} variant="glass" size="sm">
          + Nova Família
        </Button>
      </div>
    </div>
  );
};
