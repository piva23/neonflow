import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ListMusic, Users, Activity, Plus, Flame, Award, Play, Radio, ArrowRight, Sparkles, Clock, History } from 'lucide-react';
import { useFamily, useMember, usePlaylist, usePlayer, useSession } from '../hooks';
import { Button, GlassCard, SectionTitle, MemberSelector, SessionCard, ActiveSessionBanner, SessionDetailModal, TrackOptionsMenu } from '../components';
import { Session } from '../types';


export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { family, hasFamily, createFamily } = useFamily();
  const { activeMember, members } = useMember();
  const { globalTracks, playlists } = usePlaylist();
  const { playTrack, history } = usePlayer();
  const { sessions, deleteSession } = useSession();

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Redirect to Biblioteca on mount if family exists
  useEffect(() => {
    if (hasFamily && members.length > 0) {
      const timeoutId = setTimeout(() => {
        navigate('/biblioteca');
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [hasFamily, members.length, navigate]);

  // Onboarding Modal state for First Run
  const [isFirstRunModalOpen, setIsFirstRunModalOpen] = useState(false);
  const [firstFamName, setFirstFamName] = useState('');
  const [firstOwnerName, setFirstOwnerName] = useState('');
  const [firstFamColor, setFirstFamColor] = useState('#8338ec');

  const handleCreateFirstFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstFamName.trim()) {
      return;
    }
    createFamily(firstFamName, '🏠', firstFamColor, 'Nossa família musical no NeonFlow', firstOwnerName || 'Você', 'Pai');
    setIsFirstRunModalOpen(false);
  };

  // Recent 3 completed or active sessions
  const recentSessions = [...sessions].slice(0, 3);

  const popularTracks = [...globalTracks].sort((a, b) => b.playsCount - a.playsCount).slice(0, 3);

  const activeColor = activeMember?.color || '#8338ec';

  // ================= FIRST RUN / ONBOARDING VIEW =================
  if (!hasFamily || members.length === 0) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        {/* WELCOME HERO */}
        <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-brand-purple/20 via-brand-card to-brand-surface border border-brand-purple/40 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-purple/20 blur-[120px] pointer-events-none" />
          <div className="flex flex-col gap-5 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-light text-xs font-bold w-fit">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span>Primeira Execução • NeonFlow 2.0</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display text-white">
              Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple-light via-brand-cyan to-brand-pink">NeonFlow</span>
            </h1>
            
            <p className="text-sm md:text-base text-brand-text-muted leading-relaxed font-medium">
              Seu player musical familiar completo. Crie seu grupo familiar, importe suas músicas MP3 ou links do YouTube e inicie sessões de reprodução sincronizadas.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <Button onClick={() => setIsFirstRunModalOpen(true)} variant="glow" size="lg">
                <Users className="w-5 h-5" /> Criar Primeira Família
              </Button>
              <Button onClick={() => navigate('/biblioteca')} variant="primary" size="lg">
                <Plus className="w-5 h-5" /> Importar Músicas
              </Button>
              <Button onClick={() => navigate('/sessoes')} variant="secondary" size="lg">
                <Radio className="w-5 h-5" /> Criar Sessão
              </Button>
            </div>
          </div>
        </section>

        {/* ONBOARDING STEPS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col gap-3 p-6 border-brand-purple/30 hover:border-brand-purple/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-brand-purple-light font-black text-lg">
              1
            </div>
            <h3 className="text-base font-extrabold text-white">Criar Grupo Familiar</h3>
            <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
              Defina o nome da sua casa e crie os perfis para cada membro da família interagir com a música.
            </p>
            <Button onClick={() => setIsFirstRunModalOpen(true)} size="sm" variant="secondary" className="mt-auto self-start">
              Começar Agora
            </Button>
          </GlassCard>

          <GlassCard className="flex flex-col gap-3 p-6 border-brand-cyan/30 hover:border-brand-cyan/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan font-black text-lg">
              2
            </div>
            <h3 className="text-base font-extrabold text-white">Importar Músicas</h3>
            <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
              Faça upload de arquivos MP3 do seu dispositivo para o IndexedDB ou adicione URLs do YouTube.
            </p>
            <Button onClick={() => navigate('/biblioteca')} size="sm" variant="secondary" className="mt-auto self-start">
              Ir para Biblioteca
            </Button>
          </GlassCard>

          <GlassCard className="flex flex-col gap-3 p-6 border-brand-pink/30 hover:border-brand-pink/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center text-brand-pink font-black text-lg">
              3
            </div>
            <h3 className="text-base font-extrabold text-white">Criar Sessão</h3>
            <p className="text-xs text-brand-text-muted leading-relaxed font-medium">
              Monte playlists compartilhadas, acumule XP e pontuações de gamificação durante as sessões musicais.
            </p>
            <Button onClick={() => navigate('/sessoes')} size="sm" variant="secondary" className="mt-auto self-start">
              Ver Sessões
            </Button>
          </GlassCard>
        </section>

        {/* MODAL: FIRST RUN FAMILY CREATION */}
        {isFirstRunModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <GlassCard className="w-full max-w-md p-6 border-brand-purple/50 bg-brand-surface">
              <div className="flex items-center justify-between pb-4 border-b border-brand-border/60 mb-5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-purple-light" />
                  <h3 className="text-lg font-bold text-white">Criar Primeira Família</h3>
                </div>
                <button
                  onClick={() => setIsFirstRunModalOpen(false)}
                  className="p-1 rounded-lg text-brand-text-muted hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateFirstFamily} className="flex flex-col gap-4">
                <div>
                  <label className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5 block">
                    Nome da Família / Casa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Família Silva"
                    value={firstFamName}
                    onChange={(e) => setFirstFamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-brand-border text-white text-sm focus:border-brand-purple outline-none"
                  />
                </div>

                <div>
                  <label className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5 block">
                    Seu Nome (Administrador) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alex"
                    value={firstOwnerName}
                    onChange={(e) => setFirstOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-brand-border text-white text-sm focus:border-brand-purple outline-none"
                  />
                </div>

                <div>
                  <label className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted mb-1.5 block">
                    Cor Tema
                  </label>
                  <div className="flex items-center gap-2">
                    {['#8338ec', '#ff006e', '#3a86ff', '#00f5d4', '#ffbe0b'].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setFirstFamColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          firstFamColor === color ? 'scale-110 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button type="button" variant="secondary" onClick={() => setIsFirstRunModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="glow">
                    Criar e Entrar
                  </Button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Active Session Banner */}
      <ActiveSessionBanner />

      {/* ================= HERO GREETING SECTION ================= */}
      <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-brand-surface via-brand-card to-brand-surface border border-brand-border/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background glow flares */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
          style={{ backgroundColor: activeColor }}
        />

        <div className="flex items-center gap-5 relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner select-none border"
            style={{
              backgroundColor: `${activeColor}20`,
              borderColor: `${activeColor}80`,
            }}
          >
            {activeMember?.avatar || '👋'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-2xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${activeColor}15`,
                  color: activeColor,
                  borderColor: `${activeColor}40`,
                }}
              >
                {activeMember?.role || 'Membro'}
              </span>
              <span className="w-1 h-1 bg-brand-text-muted rounded-full" />
              <span className="text-2xs font-semibold text-brand-text-muted flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-display text-white">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-brand-text-muted">{activeMember?.name || 'Família'}</span>!
            </h2>
            <p className="text-xs text-brand-text-muted mt-1 max-w-md font-medium leading-relaxed">
              O que a <strong>{family.name || family.familyName}</strong> quer curtir junta hoje? Temos {globalTracks.length} músicas compartilhadas na casa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 flex-wrap">
          <Button onClick={() => navigate('/biblioteca')} variant="primary" size="md" glow>
            <Plus className="w-4 h-4" /> Cadastrar Música
          </Button>
          <Button onClick={() => navigate('/familia')} variant="secondary" size="md">
            Membros ({members.length})
          </Button>
        </div>
      </section>

      {/* ================= NETFLIX MEMBER SWITCHER ON HOME ================= */}
      <section className="p-5 rounded-3xl bg-brand-card/40 border border-brand-border/60">
        <MemberSelector variant="netflix" onAddMemberClick={() => navigate('/familia')} />
      </section>

      {/* ================= BENTO GRID - MAIN SECTIONS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Bento 1: Biblioteca */}
        <GlassCard onClick={() => navigate('/biblioteca')} className="flex flex-col justify-between h-44 group">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue rounded-xl">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Biblioteca</span>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold font-display text-white mb-1 group-hover:text-brand-blue transition-colors">
              {globalTracks.length}
            </h3>
            <p className="text-xs text-brand-text-muted font-semibold leading-none">Músicas cadastradas</p>
          </div>
        </GlassCard>

        {/* Bento 2: Playlists */}
        <GlassCard onClick={() => navigate('/playlists')} className="flex flex-col justify-between h-44 group">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple-light rounded-xl">
              <ListMusic className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Playlists</span>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold font-display text-white mb-1 group-hover:text-brand-purple-light transition-colors">
              {playlists.length}
            </h3>
            <p className="text-xs text-brand-text-muted font-semibold leading-none">Álbuns compartilhados</p>
          </div>
        </GlassCard>

        {/* Bento 3: Família */}
        <GlassCard onClick={() => navigate('/familia')} className="flex flex-col justify-between h-44 group">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Família</span>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold font-display text-white mb-1 group-hover:text-brand-cyan transition-colors">
              {members.length}
            </h3>
            <p className="text-xs text-brand-text-muted font-semibold leading-none">Membros ativos</p>
          </div>
        </GlassCard>

        {/* Bento 4: Estatísticas / Atividade */}
        <GlassCard onClick={() => navigate('/dashboard')} className="flex flex-col justify-between h-44 group">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Atividade</span>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold font-display text-white mb-1 group-hover:text-brand-pink transition-colors text-right">
              {members.reduce((acc, m) => acc + (m.statistics?.listenTime || m.listenTime || 0), 0)}m
            </h3>
            <p className="text-xs text-brand-text-muted font-semibold leading-none text-right">Tempo de audição total</p>
          </div>
        </GlassCard>

      </section>

      {/* ================= SECONDARY VIEWS GRID ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Popular Songs in the House */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionTitle title="Músicas em Destaque" subtitle="Bombando na Sala" />
          <div className="flex flex-col gap-3">
            {popularTracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-brand-card/50 border border-brand-border/60 hover:bg-brand-surface/40 hover:border-brand-purple/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono font-bold text-brand-text-muted w-4 text-center group-hover:text-brand-purple-light">
                    0{i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-brand-border flex items-center justify-center text-brand-text-muted shrink-0 relative overflow-hidden group-hover:border-brand-purple-light/40">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate leading-none mb-1">
                      {track.title}
                    </h4>
                    <p className="text-xs text-brand-text-muted truncate leading-none">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider leading-none mb-1">
                      {track.playsCount} Plays
                    </span>
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-brand-text-muted border border-brand-border/50">
                      {members.find((m) => m.id === track.addedBy)?.name || 'Família'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playTrack(track, globalTracks)}
                      className="w-8 h-8 rounded-full bg-brand-purple/10 hover:bg-brand-purple text-brand-purple-light hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                      title="Tocar Agora"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <TrackOptionsMenu track={track} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        </section>

      {/* ================= ÚLTIMAS TOCADAS (HISTORY) ================= */}
      {history.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle
              title="Últimas Tocadas"
              subtitle="Toque novamente nas suas favoritas"
            />
            <Button onClick={() => navigate('/biblioteca')} variant="ghost" size="sm">
              <span>Ver Biblioteca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {history.slice(0, 8).map((item, i) => {
              const track = globalTracks.find((t) => t.id === item.trackId) || {
                id: item.trackId,
                title: item.title || 'Música',
                artist: item.artist || 'Artista',
                thumbnail: item.thumbnail,
              } as any;
              return (
                <button
                  key={`${item.trackId}-${i}`}
                  onClick={() => playTrack(track, globalTracks)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-brand-card/50 border border-brand-border/60 hover:bg-brand-surface/40 hover:border-brand-purple/30 transition-all duration-300 cursor-pointer group min-w-[140px] max-w-[160px] shrink-0 active:scale-95"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-brand-border/40 relative group-hover:border-brand-purple-light/40">
                    <img
                      src={track.thumbnail || (track.youtubeId ? `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg` : undefined)}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="w-full text-center">
                    <p className="text-[10px] font-bold text-white truncate leading-tight">{track.title}</p>
                    <p className="text-[9px] text-brand-text-muted truncate">{track.artist}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= RECENT SESSIONS SECTION ================= */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="Últimas Sessões Musicais"
            subtitle="Experiências e memórias gravadas recentemente"
          />
          <Button onClick={() => navigate('/sessoes')} variant="ghost" size="sm">
            <span>Ver Linha do Tempo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-brand-text-muted bg-brand-surface/40 rounded-2xl border border-brand-border/60">
            Nenhuma sessão registrada ainda. Comece a ouvir músicas para criar automaticamente sua primeira Sessão Livre!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                members={members}
                onClick={() => setSelectedSession(session)}
                onDelete={deleteSession}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= FAMILY CHALLENGE BANNER ================= */}
      <section className="p-6 rounded-3xl bg-brand-surface/40 border border-brand-border/40 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-brand-pink/5 blur-[80px]" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-brand-pink/10 text-brand-pink rounded-xl border border-brand-pink/20">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight mb-0.5">Desafio da Semana: União Musical</h4>
              <p className="text-xs text-brand-text-muted max-w-lg font-medium leading-relaxed">
                Desbloqueie +500 XP extras para a <strong>{family.name || family.familyName}</strong> ouvindo 3 clássicos juntos hoje!
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/familia')} variant="glass" size="sm">
            Ver Medalhas
          </Button>
        </div>
      </section>

      {/* Session Details Modal */}
      <SessionDetailModal
        session={selectedSession}
        members={members}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />

    </div>
  );
};
