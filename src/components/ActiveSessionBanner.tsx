import React, { useState } from 'react';
import { useSession, useMember } from '../hooks';
import {
  Disc,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Plus,
  ChevronUp,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { ParticipantCard } from './ParticipantCard';
import toast from 'react-hot-toast';

export const ActiveSessionBanner: React.FC = () => {
  const {
    activeSession,
    finishActiveSession,
    cancelActiveSession,
    addParticipantToActiveSession,
    removeParticipantFromActiveSession,
    addMomentToSession,
  } = useSession();

  const { members } = useMember();

  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isAddMomentModalOpen, setIsAddMomentModalOpen] = useState(false);
  const [momentText, setMomentText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeSession) return null;

  const sessionColor = activeSession.color || '#8338ec';

  // Format active duration
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    const completed = finishActiveSession();
    if (completed) {
      toast.success(`Sessão "${completed.name}" finalizada e salva! 🎉`);
    }
  };

  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!momentText.trim()) return;

    addMomentToSession(activeSession.id, momentText.trim());
    toast.success('Momento registrado na linha do tempo! ✨');
    setMomentText('');
    setIsAddMomentModalOpen(false);
  };

  const activeParticipants = members.filter((m) =>
    activeSession.participants.includes(m.id)
  );

  return (
    <>
      {/* Floating Active Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface border border-brand-purple/40 shadow-xl overflow-hidden transition-all animate-in fade-in slide-in-from-top-3">
        <div className="p-4 flex items-center justify-between gap-4">
          
          {/* Left Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border animate-pulse"
              style={{
                backgroundColor: `${sessionColor}25`,
                borderColor: `${sessionColor}80`,
              }}
            >
              {activeSession.cover || '🎧'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sessão Ativa
                </span>
                <span className="text-2xs font-extrabold text-brand-purple-light uppercase">
                  {activeSession.type === 'planejada' ? 'Planejada' : 'Livre'}
                </span>
              </div>

              <h4 className="text-xs md:text-sm font-extrabold text-white truncate">
                {activeSession.name}
              </h4>
            </div>
          </div>

          {/* Center Timer & Track count */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-brand-text-muted shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/5 font-mono text-white">
              <Clock className="w-3.5 h-3.5 text-brand-purple-light" />
              {formatSeconds(activeSession.duration || 0)}
            </span>
            <span className="flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-brand-cyan" />
              {activeSession.songs?.length || 0} faixas
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsParticipantsModalOpen(true)}
              variant="secondary"
              size="sm"
              className="hidden md:flex"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{activeParticipants.length} Integrantes</span>
            </Button>

            <Button
              onClick={() => setIsAddMomentModalOpen(true)}
              variant="glass"
              size="sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
              <span className="hidden sm:inline">Momento</span>
            </Button>

            <Button onClick={handleFinish} variant="primary" glow size="sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalizar</span>
            </Button>
          </div>

        </div>
      </div>

      {/* MODAL: Manage Participants in Active Session */}
      <Modal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        title="Participantes na Sessão Ativa"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-brand-text-muted">
            Adicione ou remova membros da família que estão ouvindo juntos neste momento:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {members.map((m) => {
              const isParticipating = activeSession.participants.includes(m.id);
              return (
                <ParticipantCard
                  key={m.id}
                  member={m}
                  isParticipating={isParticipating}
                  onToggle={() => {
                    if (isParticipating) {
                      removeParticipantFromActiveSession(m.id, m.name);
                      toast.success(`${m.name} saiu da sessão`);
                    } else {
                      addParticipantToActiveSession(m.id, m.name, m.avatar);
                      toast.success(`${m.name} entrou na sessão! 🎉`);
                    }
                  }}
                />
              );
            })}
          </div>

          <div className="pt-2 border-t border-brand-border/40 flex justify-end">
            <Button onClick={() => setIsParticipantsModalOpen(false)} variant="primary" size="sm">
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Add Moment to Session */}
      <Modal
        isOpen={isAddMomentModalOpen}
        onClose={() => setIsAddMomentModalOpen(false)}
        title="Registrar Momento Inesquecível"
      >
        <form onSubmit={handleAddMoment} className="flex flex-col gap-4">
          <p className="text-xs text-brand-text-muted">
            Escreva uma frase ou memória curta que aconteceu durante esta sessão de música:
          </p>

          <textarea
            value={momentText}
            onChange={(e) => setMomentText(e.target.value)}
            placeholder="Ex: Todo mundo cantou o refrão no quintal! Ou a Vovó pediu para tocar MPB."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-purple transition-all resize-none"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" onClick={() => setIsAddMomentModalOpen(false)} variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow size="sm">
              Salvar Momento
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
