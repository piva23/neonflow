import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Sparkles,
  TrendingUp,
  Calendar,
  Flame,
  Disc,
  Trophy,
  User,
  History,
  CheckCircle2,
  Lock,
  Zap,
  Users,
  FileText,
} from 'lucide-react';
import { useFamily, useMember, usePlaylist, useSession } from '../hooks';
import { PageHeader, GlassCard, SectionTitle, EmptyState, Button } from '../components';
import {
  DashboardViewModel,
  RankingViewModel,
  AchievementsViewModel,
  TimelineViewModel,
  HistoryViewModel,
  ProfileViewModel,
  SessionSummaryViewModel,
} from '../core/progression/viewModels';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { family, hasFamily } = useFamily();
  const { members, activeMember } = useMember();
  const { globalTracks } = usePlaylist();
  const { sessions } = useSession();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'perfil' | 'ranking' | 'conquistas' | 'timeline' | 'resumo'
  >('overview');

  // Selected member for detail tabs
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    activeMember?.id || (members[0]?.id ?? 'm-1')
  );

  // Filters for achievements tab
  const [achCategoryFilter, setAchCategoryFilter] = useState<string>('todos');
  const [achStatusFilter, setAchStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'locked'>('all');

  // Member IDs array
  const memberIds = members.map((m) => m.id);

  // 1. Dashboard View Model data
  const dashData = DashboardViewModel.getDashboardData(family.id, memberIds);

  // 2. Ranking View Model data
  const leaderboard = RankingViewModel.getLeaderboard(memberIds);

  // 3. Profile View Model data for selected member
  const profileData = ProfileViewModel.getProfileData(selectedMemberId);
  const currentMemberObj = members.find((m) => m.id === selectedMemberId) || activeMember;

  // 4. Achievements View Model data
  const achievementsList = AchievementsViewModel.getMemberAchievementsView(selectedMemberId, {
    category: achCategoryFilter as any,
    status: achStatusFilter,
  });
  const achSummary = AchievementsViewModel.getAchievementsSummary(selectedMemberId);

  // 5. Timeline View Model data
  const timelineEvents = TimelineViewModel.getTimelineData(selectedMemberId);

  // 6. History View Model data
  const historyData = HistoryViewModel.getHistoryData(selectedMemberId);

  // 7. Session Summary View Model data
  const latestSession = sessions.length > 0 ? sessions[0] : null;
  const sessionReport = latestSession
    ? SessionSummaryViewModel.generateReport(latestSession, selectedMemberId)
    : null;

  // Chart data for member XP comparison
  const memberXpChartData = leaderboard.map((entry) => {
    const mem = members.find((m) => m.id === entry.memberId);
    return {
      name: mem?.name || 'Membro',
      xp: entry.totalXp,
      color: mem?.color || '#8338ec',
    };
  });

  // Chart data for weekly listening trends
  const listeningTrendsData = [
    { name: 'Seg', minutos: Math.round(profileData.totalMinutesListened * 0.1), faixas: 4 },
    { name: 'Ter', minutos: Math.round(profileData.totalMinutesListened * 0.12), faixas: 6 },
    { name: 'Qua', minutos: Math.round(profileData.totalMinutesListened * 0.15), faixas: 8 },
    { name: 'Qui', minutos: Math.round(profileData.totalMinutesListened * 0.18), faixas: 10 },
    { name: 'Sex', minutos: Math.round(profileData.totalMinutesListened * 0.22), faixas: 14 },
    { name: 'Sáb', minutos: Math.round(profileData.totalMinutesListened * 0.28), faixas: 18 },
    { name: 'Dom', minutos: Math.round(profileData.totalMinutesListened * 0.25), faixas: 15 },
  ];

  if (!hasFamily || members.length === 0) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <PageHeader
          title="Painel de Progressão & XP"
          description="Sistema oficial de gamificação do NeonFlow. Acompanhe a curva de níveis, conquistas, histórico e engajamento da família em tempo real."
        />
        <EmptyState
          title="Nenhuma Família Encontrada"
          description="Para visualizar estatísticas, rankings e conquistas de gamificação, crie sua primeira família no NeonFlow."
          actionLabel="Criar Família"
          onActionClick={() => navigate('/familia')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header */}
      <PageHeader
        title="Painel de Progressão & XP"
        description="Sistema oficial de gamificação do NeonFlow. Acompanhe a curva de níveis, conquistas, histórico e engajamento da família em tempo real."
      />

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border/60">
        {[
          { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { id: 'perfil', label: 'Perfil do Membro', icon: User },
          { id: 'ranking', label: 'Ranking da Casa', icon: Trophy },
          { id: 'conquistas', label: 'Conquistas', icon: Award },
          { id: 'timeline', label: 'Timeline & Histórico', icon: History },
          { id: 'resumo', label: 'Resumo da Sessão', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/25 scale-102 border border-brand-purple-light/40'
                  : 'bg-black/30 border border-brand-border/40 text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Member Selector Bar for Detailed Tabs */}
      {activeTab !== 'overview' && activeTab !== 'ranking' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-surface/60 border border-brand-border/60 flex-wrap gap-3">
          <span className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-purple-light" /> Selecionar Membro para Análise:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {members.map((m) => {
              const isSelected = m.id === selectedMemberId;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 text-white border border-brand-purple'
                      : 'bg-black/20 text-brand-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-sm">{m.avatar}</span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 1: VISÃO GERAL ================= */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* STATS ROW */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex items-center justify-between">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-text-muted">
                  XP Coletivo da Família
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {dashData.familyTotalXp} <span className="text-xs text-brand-purple-light">XP</span>
                </h3>
                <span className="text-3xs text-brand-cyan font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> Nível {dashData.familyLevel} • {dashData.familyLevelTitle}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-purple/10 text-brand-purple-light flex items-center justify-center border border-brand-purple/20">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex items-center justify-between">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-text-muted">
                  Membros Ativos
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{dashData.activeMembersCount} Membros</h3>
                <span className="text-3xs text-brand-purple-light font-bold flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3" /> Progresso Sincronizado
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center border border-brand-cyan/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex items-center justify-between">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-text-muted">
                  Líder de XP Atual
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {members.find((m) => m.id === dashData.topContributorId)?.name || 'Todos'}
                </h3>
                <span className="text-3xs text-orange-400 font-bold flex items-center gap-1 mt-1">
                  <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> Maior Pontuador
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex items-center justify-between">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-text-muted">
                  Vantagens Desbloqueadas
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{dashData.familyPerks.length} Perks</h3>
                <span className="text-3xs text-brand-pink font-bold flex items-center gap-1 mt-1">
                  Pelo progresso coletivo
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-pink/10 text-brand-pink flex items-center justify-center border border-brand-pink/20">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* FAMILY PROGRESS BAR */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-purple-light">
                  Progresso Coletivo
                </span>
                <h3 className="text-lg font-bold text-white">Nível da Casa: {dashData.familyLevel}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                {dashData.familyCurrentXp} / {dashData.familyNextLevelXp} XP ({dashData.familyProgressPercent}%)
              </span>
            </div>

            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-brand-border/60">
              <div
                className="h-full bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-cyan rounded-full transition-all duration-500"
                style={{ width: `${dashData.familyProgressPercent}%` }}
              />
            </div>
          </GlassCard>

          {/* CHARTS SECTION */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <SectionTitle title="Estimativa de Audição Coletiva" subtitle="Engajamento Semanal" />
              <div className="p-5 rounded-3xl bg-brand-card/50 border border-brand-border/60 h-80 flex flex-col justify-between">
                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={listeningTrendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMinutos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7b2cbf" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#7b2cbf" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121420',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          color: '#f8f9fa',
                        }}
                      />
                      <Area type="monotone" dataKey="minutos" stroke="#9d4edd" strokeWidth={2.5} fill="url(#colorMinutos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle title="Distribuição de XP Real" subtitle="Pontuação dos Membros" />
              <div className="p-5 rounded-3xl bg-brand-card/50 border border-brand-border/60 h-80 flex flex-col justify-between">
                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberXpChartData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#f8f9fa" fontSize={12} width={70} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121420',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          color: '#f8f9fa',
                        }}
                      />
                      <Bar dataKey="xp" radius={[0, 8, 8, 0]} barSize={16}>
                        {memberXpChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 2: PERFIL DO MEMBRO ================= */}
      {activeTab === 'perfil' && (
        <div className="flex flex-col gap-6">
          {/* Main Profile Header */}
          <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div
              className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
              style={{ backgroundColor: currentMemberObj?.color || '#8338ec' }}
            />

            <div className="flex items-center gap-6 relative z-10">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border shrink-0"
                style={{
                  backgroundColor: `${currentMemberObj?.color || '#8338ec'}20`,
                  borderColor: currentMemberObj?.color || '#8338ec',
                }}
              >
                {currentMemberObj?.avatar || '🎧'}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-3xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${currentMemberObj?.color || '#8338ec'}20`,
                      color: currentMemberObj?.color || '#8338ec',
                      borderColor: `${currentMemberObj?.color || '#8338ec'}60`,
                    }}
                  >
                    {currentMemberObj?.role || 'Membro'}
                  </span>
                  <span className="text-3xs font-bold text-orange-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                    {profileData.streakDays} Dias de Streak
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white font-display">
                  {currentMemberObj?.name}
                </h2>

                <p className="text-xs text-brand-purple-light font-bold mt-1">
                  Nível {profileData.level} • {profileData.levelTitle}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 relative z-10 shrink-0">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">
                Pontuação Total
              </span>
              <span className="text-3xl font-black text-white font-mono">
                {profileData.totalXp} <span className="text-sm text-brand-purple-light">XP</span>
              </span>
            </div>
          </GlassCard>

          {/* Level Progress Bar */}
          <GlassCard className="p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider">
              <span className="text-brand-text-muted">Progresso para o Nível {profileData.level + 1}</span>
              <span className="text-white font-mono">
                {profileData.currentXp} / {profileData.nextLevelXp} XP ({profileData.xpPercentage}%)
              </span>
            </div>

            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-brand-border/60">
              <div
                className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full transition-all duration-500"
                style={{ width: `${profileData.xpPercentage}%` }}
              />
            </div>
          </GlassCard>

          {/* Member Statistics Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Minutos Ouvidos</span>
              <span className="text-lg font-black text-white">{profileData.totalMinutesListened}m</span>
            </div>
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Músicas Tocadas</span>
              <span className="text-lg font-black text-white">{profileData.tracksPlayed}</span>
            </div>
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Músicas Curtidas</span>
              <span className="text-lg font-black text-white">{profileData.tracksLiked}</span>
            </div>
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Playlists Criadas</span>
              <span className="text-lg font-black text-white">{profileData.playlistsCreated}</span>
            </div>
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Sessões Coletivas</span>
              <span className="text-lg font-black text-white">{profileData.sessionsParticipated}</span>
            </div>
            <div className="p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 flex flex-col gap-1">
              <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Insígnias</span>
              <span className="text-lg font-black text-white">{profileData.unlockedBadgesCount}</span>
            </div>
          </section>

          {/* Unlocked Badges Showcase */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <SectionTitle title="Badges e Recompensas Ativas" subtitle="Insígnias do Perfil" />
            {profileData.unlockedRewards.length === 0 ? (
              <p className="text-xs text-brand-text-muted italic">
                Nenhuma insígnia especial desbloqueada ainda. Continue ouvindo sessões e cumprindo conquistas!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profileData.unlockedRewards.map((rew) => (
                  <div
                    key={rew.id}
                    className="p-4 rounded-2xl bg-brand-surface/60 border border-brand-border/60 flex items-center gap-3"
                  >
                    <span className="text-2xl">{rew.badgeIcon}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{rew.title}</h4>
                      <p className="text-3xs text-brand-text-muted truncate">{rew.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ================= TAB 3: RANKING DA CASA ================= */}
      {activeTab === 'ranking' && (
        <div className="flex flex-col gap-6">
          <SectionTitle
            title="Tabela de Classificação da Casa"
            subtitle="Placar oficial ordenado por XP total acumulado na aplicação"
          />

          <div className="flex flex-col gap-4">
            {leaderboard.map((entry) => {
              const mem = members.find((m) => m.id === entry.memberId);
              if (!mem) return null;

              return (
                <GlassCard
                  key={mem.id}
                  className={`p-5 flex items-center justify-between gap-4 transition-all ${
                    entry.isPodium ? 'border-brand-purple/40 bg-brand-surface/80 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black w-8 text-center select-none">
                      {entry.podiumBadge || `${entry.rank}°`}
                    </span>

                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0"
                      style={{
                        backgroundColor: `${mem.color || '#8338ec'}20`,
                        borderColor: mem.color || '#8338ec',
                      }}
                    >
                      {mem.avatar || '🎧'}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        {mem.name}
                        <span
                          className="text-3xs font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${mem.color || '#8338ec'}15`,
                            color: mem.color || '#8338ec',
                            borderColor: `${mem.color || '#8338ec'}40`,
                          }}
                        >
                          {mem.role}
                        </span>
                      </h3>
                      <p className="text-xs text-brand-purple-light font-bold mt-0.5">
                        Nível {entry.level} • {entry.levelTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-3xs uppercase font-extrabold text-brand-text-muted">
                        Streak
                      </span>
                      <span className="text-xs font-bold text-orange-400">
                        🔥 {entry.streakDays} Dias
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-3xs uppercase font-extrabold text-brand-text-muted">
                        XP Total
                      </span>
                      <span className="text-lg font-black text-white font-mono">
                        {entry.totalXp} <span className="text-3xs text-brand-purple-light">XP</span>
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CONQUISTAS ================= */}
      {activeTab === 'conquistas' && (
        <div className="flex flex-col gap-6">
          {/* Achievements Summary Banner */}
          <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand-purple/20 text-brand-purple-light rounded-2xl border border-brand-purple/40">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Progresso Geral de Conquistas</h3>
                <p className="text-xs text-brand-text-muted">
                  {achSummary.completed} de {achSummary.total} medalhas desbloqueadas ({achSummary.completionPercentage}%)
                </p>
              </div>
            </div>

            <div className="w-full md:w-64 flex flex-col gap-1.5">
              <div className="flex justify-between text-2xs font-extrabold text-brand-text-muted">
                <span>Concluídas</span>
                <span className="text-white font-mono">{achSummary.completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-brand-border">
                <div
                  className="h-full bg-brand-cyan rounded-full transition-all"
                  style={{ width: `${achSummary.completionPercentage}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/30 border border-brand-border/60">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              {['todos', 'Músicas', 'Playlists', 'Família', 'Sessões', 'Descobertas', 'Tempo ouvido'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAchCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    achCategoryFilter === cat
                      ? 'bg-brand-purple text-white'
                      : 'bg-white/5 text-brand-text-muted hover:text-white'
                  }`}
                >
                  {cat === 'todos' ? 'Todas Categoria' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(['all', 'completed', 'in_progress', 'locked'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAchStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    achStatusFilter === st
                      ? 'bg-brand-cyan text-black'
                      : 'bg-white/5 text-brand-text-muted hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Todas' : st === 'completed' ? 'Concluídas' : st === 'in_progress' ? 'Em Progresso' : 'Bloqueadas'}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {achievementsList.map((ach) => (
              <GlassCard
                key={ach.id}
                className={`flex flex-col justify-between gap-4 p-5 relative overflow-hidden transition-all ${
                  ach.progresso.completed
                    ? 'border-brand-purple/40 bg-brand-card/80'
                    : 'opacity-70 border-white/10 bg-black/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{ach.ícone}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ach.nome}</h4>
                      <span className="text-3xs font-extrabold uppercase text-brand-purple-light">
                        {ach.raridade} • +{ach.xp} XP
                      </span>
                    </div>
                  </div>

                  {ach.progresso.completed ? (
                    <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-xl bg-white/5 text-brand-text-muted">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-brand-text-muted leading-relaxed">{ach.descrição}</p>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-3xs font-extrabold text-brand-text-muted">
                    <span>
                      {ach.progresso.currentValue} / {ach.progresso.targetValue}
                    </span>
                    <span>{ach.progresso.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ach.progresso.completed ? 'bg-brand-cyan' : 'bg-brand-purple'
                      }`}
                      style={{ width: `${ach.progresso.percent}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: TIMELINE & HISTÓRICO ================= */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline Events Column */}
          <div className="flex flex-col gap-4">
            <SectionTitle title="Linha do Tempo de Conquistas" subtitle="Marcos Importantes" />

            {timelineEvents.length === 0 ? (
              <p className="text-xs text-brand-text-muted italic p-6 bg-brand-surface/40 rounded-2xl border border-brand-border">
                Nenhum marco registrado na linha do tempo ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-3 relative border-l-2 border-brand-purple/30 pl-4 ml-2">
                {timelineEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl bg-brand-card/60 border border-brand-border/60 relative flex flex-col gap-1"
                  >
                    <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-brand-purple border-2 border-black" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      {evt.xpValue && (
                        <span className="text-3xs font-bold text-brand-cyan font-mono">
                          +{evt.xpValue} XP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-muted">{evt.description}</p>
                    <span className="text-3xs text-brand-text-muted font-mono mt-1">
                      {new Date(evt.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History XP Logs Column */}
          <div className="flex flex-col gap-4">
            <SectionTitle title="Histórico de Registros de XP" subtitle="Auditoria de Pontos" />

            {historyData.logs.length === 0 ? (
              <p className="text-xs text-brand-text-muted italic p-6 bg-brand-surface/40 rounded-2xl border border-brand-border">
                Nenhum registro de XP encontrado.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                {historyData.logs.map((log) => (
                  <div
                    key={log.event.id}
                    className="p-3.5 rounded-2xl bg-black/40 border border-brand-border/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple-light shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{log.event.type}</h4>
                        <span className="text-3xs font-mono text-brand-text-muted">
                          {new Date(log.event.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-brand-cyan font-mono shrink-0">
                      +{log.xpGained} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: RESUMO DA SESSÃO ================= */}
      {activeTab === 'resumo' && (
        <div className="flex flex-col gap-6">
          <SectionTitle
            title="Relatório de Resumo de Sessão"
            subtitle="Detalhamento exato de ganhos e evolução produzidos pela Engine de Progressão"
          />

          {!sessionReport ? (
            <div className="p-8 text-center text-xs text-brand-text-muted bg-brand-surface/40 rounded-3xl border border-brand-border">
              Nenhuma sessão ativa ou concluída encontrada para gerar relatório. Inicie uma escuta no player!
            </div>
          ) : (
            <GlassCard className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
                <div>
                  <span className="text-3xs font-extrabold uppercase tracking-widest text-brand-purple-light">
                    Sessão Sintonizada
                  </span>
                  <h3 className="text-2xl font-black text-white font-display mt-0.5">
                    {sessionReport.sessionName}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-1">
                    Duração: {sessionReport.durationMinutes} minutos • Músicas Ouvidas: {sessionReport.totalTracksPlayed}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40 text-center">
                    <span className="text-3xs uppercase font-extrabold text-brand-text-muted block">
                      XP Individual
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      +{sessionReport.individualXp} XP
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 text-center">
                    <span className="text-3xs uppercase font-extrabold text-brand-text-muted block">
                      XP Família
                    </span>
                    <span className="text-xl font-black text-white font-mono">
                      +{sessionReport.familyXp} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Level up notice if present */}
              {sessionReport.levelUp && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center gap-4 text-amber-200">
                  <Award className="w-8 h-8 text-amber-300 animate-bounce" />
                  <div>
                    <h4 className="text-sm font-bold">SUBIU DE NÍVEL! 🎉</h4>
                    <p className="text-xs">
                      Parabéns! O membro alcançou o Nível {sessionReport.newLevel}!
                    </p>
                  </div>
                </div>
              )}

              {/* Unlocked Achievements list */}
              {sessionReport.unlockedAchievements.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-purple-light">
                    Conquistas Desbloqueadas nesta Sessão:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessionReport.unlockedAchievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="p-3.5 rounded-2xl bg-brand-surface/80 border border-brand-purple/40 flex items-center gap-3"
                      >
                        <span className="text-2xl">{ach.ícone}</span>
                        <div>
                          <h5 className="text-xs font-bold text-white">{ach.nome}</h5>
                          <p className="text-3xs text-brand-text-muted">{ach.descrição}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* XP Breakdown Notes */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-muted">
                  Detalhamento de Cálculo da Engine:
                </h4>
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-brand-text-muted font-mono">
                  {sessionReport.breakdownNotes.map((note, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-brand-purple-light">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};
