import React from 'react';
import { Family } from '../types';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { Users, Clock, Music, ListMusic, Award, Copy, Check, Edit3, Sparkles, CopyPlus, Trash2, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { ICON_MAP } from './AvatarSelector';
import { DashboardViewModel } from '../core/progression/viewModels/DashboardViewModel';

interface FamilyCardProps {
  family: Family;
  onEditFamily?: () => void;
  onDuplicateFamily?: () => void;
  onDeleteFamily?: () => void;
  onAddMember?: () => void;
  onSwitchFamily?: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({
  family,
  onEditFamily,
  onDuplicateFamily,
  onDeleteFamily,
  onAddMember,
  onSwitchFamily,
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const memberIds = family.members?.map((m) => m.id) || [];
  const dashData = DashboardViewModel.getDashboardData(family.id, memberIds);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family.inviteCode || '');
    setCopiedCode(true);
    toast.success('Código de convite copiado!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalListenHours = Math.floor((family.statistics?.totalListenTime || 0) / 60);
  const totalListenMinutes = (family.statistics?.totalListenTime || 0) % 60;

  const primaryColor = family.color || '#8338ec';

  const renderPhoto = () => {
    const photo = family.photo || '🏠';
    if (photo.startsWith('http')) {
      return (
        <img
          src={photo}
          alt={family.name}
          className="w-full h-full object-cover rounded-2xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      );
    }
    if (photo.startsWith('icon:')) {
      const name = photo.replace('icon:', '');
      const IconComponent = ICON_MAP[name] || Home;
      return <span className="w-10 h-10 inline-flex"><IconComponent className="w-10 h-10" style={{ color: primaryColor } as React.CSSProperties} /></span>;
    }
    return <span className="text-5xl leading-none">{photo}</span>;
  };

  const renderPhotoWithFallback = () => {
    const photo = family.photo || '🏠';
    return (
      <>
        {renderPhoto()}
        {photo.startsWith('http') && (
          <span
            className="absolute inset-0 w-full h-full flex items-center justify-center text-5xl"
            style={{ display: 'none' }}
          >
            🏠
          </span>
        )}
      </>
    );
  };

  return (
    <GlassCard className="relative overflow-hidden p-6 md:p-8 flex flex-col gap-6 border-brand-purple/30 bg-gradient-to-br from-brand-card/90 via-brand-surface/70 to-brand-card/90">
      {/* Background Glow Effect */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-30"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Main Family Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        
        <div className="flex items-center gap-5 min-w-0">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border shrink-0 select-none overflow-hidden relative"
            style={{
              backgroundColor: `${primaryColor}20`,
              borderColor: `${primaryColor}80`,
            }}
          >
            {renderPhotoWithFallback()}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40">
                Família Ativa
              </span>
              <span className="text-3xs font-mono text-brand-text-muted">
                Criada em {new Date(family.createdAt || Date.now()).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black font-display text-white tracking-tight truncate">
              {family.name || family.familyName}
            </h1>

            <p className="text-xs text-brand-text-muted mt-1 max-w-xl font-medium leading-relaxed">
              {family.description || 'Unidos pelas melhores playlists do NeonFlow!'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onAddMember && (
            <Button onClick={onAddMember} variant="primary" size="sm" glow>
              <Users className="w-3.5 h-3.5" /> + Membro
            </Button>
          )}
          {onEditFamily && (
            <Button onClick={onEditFamily} variant="secondary" size="sm">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </Button>
          )}
          {onDuplicateFamily && (
            <Button onClick={onDuplicateFamily} variant="glass" size="sm" title="Duplicar Família">
              <CopyPlus className="w-3.5 h-3.5" /> Duplicar
            </Button>
          )}
          {onDeleteFamily && (
            <button
              onClick={onDeleteFamily}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
              title="Excluir Família"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onSwitchFamily && (
            <Button onClick={onSwitchFamily} variant="glass" size="sm">
              Trocar
            </Button>
          )}
        </div>
      </div>

      {/* Invite Code & Settings Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-brand-border/50 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
            Código da Família:
          </span>
          <span className="text-xs font-mono font-bold text-white tracking-wider px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
            {family.inviteCode || 'NF-742-SLV'}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-brand-purple/20 text-brand-purple-light hover:bg-brand-purple hover:text-white transition-all cursor-pointer"
            title="Copiar Código"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-3xs font-semibold text-brand-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Sincronização Ativa • Gênero Preferido: <strong>{family.settings?.defaultGenre || 'Pop'}</strong></span>
        </div>
      </div>

      {/* Grid Statistics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-brand-border/40 relative z-10">
        <div className="flex flex-col p-3 rounded-xl bg-white/2.5 border border-white/5">
          <div className="flex items-center gap-1.5 text-brand-text-muted text-3xs font-extrabold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-brand-purple-light" /> Membros
          </div>
          <span className="text-xl font-extrabold text-white">
            {family.members?.length || family.statistics?.totalMembers || 0}
          </span>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-white/2.5 border border-white/5">
          <div className="flex items-center gap-1.5 text-brand-text-muted text-3xs font-extrabold uppercase tracking-wider mb-1">
            <Music className="w-3.5 h-3.5 text-brand-blue" /> Músicas
          </div>
          <span className="text-xl font-extrabold text-white">
            {family.statistics?.totalTracks || 0}
          </span>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-white/2.5 border border-white/5">
          <div className="flex items-center gap-1.5 text-brand-text-muted text-3xs font-extrabold uppercase tracking-wider mb-1">
            <ListMusic className="w-3.5 h-3.5 text-brand-pink" /> Playlists
          </div>
          <span className="text-xl font-extrabold text-white">
            {family.statistics?.totalPlaylists || 0}
          </span>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-white/2.5 border border-white/5">
          <div className="flex items-center gap-1.5 text-brand-text-muted text-3xs font-extrabold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-brand-cyan" /> Tempo Ouvido
          </div>
          <span className="text-xl font-extrabold text-white">
            {totalListenHours}h {totalListenMinutes}m
          </span>
        </div>

        <div className="flex flex-col p-3 rounded-xl bg-white/2.5 border border-white/5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-brand-text-muted text-3xs font-extrabold uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5 text-orange-400" /> XP Família
          </div>
          <span className="text-xl font-extrabold text-white">
            {dashData.familyTotalXp} <span className="text-3xs text-brand-purple-light">XP (Nível {dashData.familyLevel})</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
