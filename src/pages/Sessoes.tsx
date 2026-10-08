import React, { useState } from 'react';
import { useSession, useMember } from '../hooks';
import {
  PageHeader,
  Button,
  SessionCard,
  ActiveSessionBanner,
  NewSessionModal,
  SessionDetailModal,
  EmptyState,
} from '../components';
import { Session } from '../types';
import { Disc, Plus, Sparkles, Filter, Calendar, Clock } from 'lucide-react';

export const Sessoes: React.FC = () => {
  const { sessions, activeSession, deleteSession } = useSession();
  const { members } = useMember();

  const [filterType, setFilterType] = useState<'todas' | 'planejada' | 'livre' | 'ativa'>('todas');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Filtered sessions list
  const filteredSessions = sessions.filter((sess) => {
    if (filterType === 'todas') return true;
    if (filterType === 'planejada') return sess.type === 'planejada';
    if (filterType === 'livre') return sess.type === 'livre';
    if (filterType === 'ativa') return sess.status === 'active';
    return true;
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Active Session Floating Banner */}
      <ActiveSessionBanner />

      {/* Page Header */}
      <PageHeader
        title="Sessões Musicais"
        description="Sua linha do tempo de momentos e experiências ouvidas em família."
        actionSlot={
          <Button onClick={() => setIsNewModalOpen(true)} variant="primary" glow size="md">
            <Plus className="w-4 h-4" /> Nova Sessão Planejada
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-surface/60 border border-brand-border/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todas', label: `Todas (${sessions.length})` },
            { id: 'planejada', label: `Planejadas (${sessions.filter((s) => s.type === 'planejada').length})` },
            { id: 'livre', label: `Livres (${sessions.filter((s) => s.type === 'livre').length})` },
            { id: 'ativa', label: activeSession ? 'Ativa (1)' : 'Ativa (0)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                  : 'bg-black/30 border border-brand-border/40 text-brand-text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-2xs font-semibold text-brand-text-muted flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
          {sessions.length} experiências gravadas
        </span>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          title="Nenhuma sessão encontrada"
          description="Inicie uma música para criar uma Sessão Livre automaticamente ou crie uma Sessão Planejada para a família!"
          action={
            <Button onClick={() => setIsNewModalOpen(true)} variant="primary" glow>
              <Plus className="w-4 h-4" /> Criar Primeira Sessão
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
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

      {/* MODAL: New Planned Session */}
      <NewSessionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* MODAL: Session Detail & Timeline */}
      <SessionDetailModal
        session={selectedSession}
        members={members}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />

    </div>
  );
};
