import React, { useState } from 'react';
import { Session, Member } from '../types';
import { Modal } from './Modal';
import { SessionHeader } from './SessionHeader';
import { SessionTimeline } from './SessionTimeline';
import { ParticipantCard } from './ParticipantCard';
import { usePlayer, useSession } from '../hooks';
import {
  Music,
  Clock,
  Award,
  Sparkles,
  Play,
  Heart,
  Forward,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from './Button';
import toast from 'react-hot-toast';

interface SessionDetailModalProps {
  session: Session | null;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  members,
  isOpen,
  onClose,
}) => {
  const { addMomentToSession, finishActiveSession, cancelActiveSession } = useSession();
  const { playTrack } = usePlayer();

  const [activeTab, setActiveTab] = useState<'timeline' | 'songs' | 'moments' | 'participants'>('timeline');
  const [newMomentText, setNewMomentText] = useState('');

  if (!session) return null;

  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMomentText.trim()) return;

    addMomentToSession(session.id, newMomentText.trim());
    toast.success('Momento registrado com sucesso! ✨');
    setNewMomentText('');
  };

  const participantMembers = members.filter((m) =>
    session.participants.includes(m.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Sessão`}>
      <div className="flex flex-col gap-6 max-h-[82vh] overflow-y-auto pr-1">
        
        {/* Header */}
        <SessionHeader
          session={session}
          members={members}
          onFinish={() => {
            finishActiveSession();
            toast.success('Sessão finalizada!');
          }}
          onCancel={() => {
            cancelActiveSession();
            toast.success('Sessão cancelada');
            onClose();
          }}
        />

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-brand-border/60 pb-2">
          {[
            { id: 'timeline', label: 'Linha do Tempo' },
            { id: 'songs', label: `Músicas (${session.songs?.length || 0})` },
            { id: 'moments', label: `Memórias (${session.favoriteMoments?.length || 0})` },
            { id: 'participants', label: `Participantes (${participantMembers.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-purple text-white shadow-md'
                  : 'bg-black/30 border border-brand-border/40 text-brand-text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: TIMELINE */}
        {activeTab === 'timeline' && (
          <SessionTimeline timeline={session.timeline} songs={session.songs} />
        )}

        {/* TAB 2: SONGS */}
        {activeTab === 'songs' && (
          <div className="flex flex-col gap-3">
            {(!session.songs || session.songs.length === 0) ? (
              <div className="p-8 text-center text-xs font-semibold text-brand-text-muted bg-brand-surface/40 rounded-2xl border border-brand-border">
                Nenhuma música registrada nesta sessão ainda.
              </div>
            ) : (
              session.songs.map((song, i) => (
                <div
                  key={song.id || i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-card/60 border border-brand-border/60 hover:bg-brand-surface/60 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-brand-text-muted w-5 text-center">
                      0{i + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{song.title}</h4>
                      <p className="text-3xs text-brand-text-muted truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {song.listenedTime > 0 && (
                      <span className="text-3xs font-semibold text-brand-text-muted px-2 py-0.5 rounded bg-white/5">
                        {Math.floor(song.listenedTime / 60)}m {song.listenedTime % 60}s
                      </span>
                    )}

                    {song.favorited && (
                      <Heart className="w-4 h-4 text-brand-pink fill-current" />
                    )}

                    {song.skipped && (
                      <Forward className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MOMENTS */}
        {activeTab === 'moments' && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleAddMoment} className="flex gap-2">
              <input
                type="text"
                placeholder="Registrar uma memória ou frase da sessão..."
                value={newMomentText}
                onChange={(e) => setNewMomentText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-brand-border/60 text-xs text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-purple"
              />
              <Button type="submit" variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </form>

            {(!session.favoriteMoments || session.favoriteMoments.length === 0) ? (
              <div className="p-8 text-center text-xs font-semibold text-brand-text-muted bg-brand-surface/40 rounded-2xl border border-brand-border">
                Nenhum momento registrado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {session.favoriteMoments.map((mom, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <p className="font-medium leading-relaxed">{mom}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PARTICIPANTS */}
        {activeTab === 'participants' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => {
              const pDetail = session.participantDetails?.find((p) => p.memberId === m.id);
              const isParticipantInArray = session.participants.includes(m.id);
              const status = pDetail?.status || (isParticipantInArray ? 'participando' : 'ausente');

              return (
                <ParticipantCard
                  key={m.id}
                  member={m}
                  status={status}
                  isParticipating={status !== 'ausente'}
                />
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-brand-border/40 flex justify-end">
          <Button onClick={onClose} variant="ghost" size="sm">
            Fechar
          </Button>
        </div>

      </div>
    </Modal>
  );
};
