import React, { useState } from 'react';
import { useSession, useMember, usePlaylist } from '../hooks';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { AvatarSelector } from './AvatarSelector';
import { ColorSelector } from './ColorSelector';
import { ParticipantStatus, SessionParticipant } from '../types';
import { Gamepad2, Calendar, FileText, Users, Disc, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({ isOpen, onClose }) => {
  const { startPlanejadaSession } = useSession();
  const { members, activeMember } = useMember();
  const { playlists } = usePlaylist();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [controllerId, setControllerId] = useState<string>(activeMember?.id || members[0]?.id || '');
  const [scheduledAt, setScheduledAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');

  // Map memberId -> ParticipantStatus ('participando' | 'ausente' | 'convidado')
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, ParticipantStatus>>(() => {
    const initialMap: Record<string, ParticipantStatus> = {};
    members.forEach((m) => {
      initialMap[m.id] = 'participando';
    });
    return initialMap;
  });

  const [mood, setMood] = useState('Festa & Alegria');
  const [objective, setObjective] = useState('');
  const [cover, setCover] = useState('🚗');
  const [color, setColor] = useState('#ff006e');

  const handleStatusChange = (memberId: string, status: ParticipantStatus) => {
    setParticipantStatuses((prev) => ({
      ...prev,
      [memberId]: status,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Preencha o nome da sessão!');
      return;
    }

    const selectedPlaylist = playlists.find((p) => p.id === playlistId);
    const selectedController = members.find((m) => m.id === controllerId);

    // Build participant details
    const participantDetails: SessionParticipant[] = members.map((m) => ({
      memberId: m.id,
      name: m.name,
      avatar: m.avatar,
      status: participantStatuses[m.id] || 'participando',
    }));

    // Participant IDs who are 'participando' or 'convidado'
    const activeParticipantIds = participantDetails
      .filter((p) => p.status !== 'ausente')
      .map((p) => p.memberId);

    const created = startPlanejadaSession({
      name: name.trim(),
      description: description.trim(),
      playlistId: playlistId || undefined,
      playlistName: selectedPlaylist?.name,
      controllerId,
      controllerName: selectedController?.name,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes: notes.trim(),
      participants: activeParticipantIds.length > 0 ? activeParticipantIds : members.map((m) => m.id),
      participantDetails,
      mood,
      objective: objective.trim(),
      cover,
      color,
    });

    toast.success(`Sessão Planejada "${created.name}" iniciada! 🎉`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Sessão Planejada">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
        
        {/* Session Name */}
        <Input
          label="Nome da Sessão *"
          placeholder="Ex: Churrasco de Domingo, Viagem para Praia, Noite do Pop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Playlist Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-brand-purple-light" />
            Playlist Base (Opcional)
          </label>
          <select
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-white focus:outline-none focus:border-brand-purple transition-all"
          >
            <option value="">Sem playlist fixa (Seleção livre durante a sessão)</option>
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                🎵 {pl.name} ({pl.tracks?.length || 0} faixas)
              </option>
            ))}
          </select>
        </div>

        {/* Quem Controla (Controller Selector) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-brand-cyan" />
            Quem Controla a Sessão
          </label>
          <select
            value={controllerId}
            onChange={(e) => setControllerId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-white focus:outline-none focus:border-brand-cyan transition-all"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name} ({m.role})
              </option>
            ))}
          </select>
          <p className="text-3xs text-brand-text-muted">
            O controlador é o membro responsável por escolher e passar as músicas.
          </p>
        </div>

        {/* Data / Horário Agendado */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-pink" />
            Data e Horário da Sessão
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-white focus:outline-none focus:border-brand-pink transition-all"
          />
        </div>

        {/* Participantes & Status */}
        <div className="flex flex-col gap-2.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand-purple-light" />
            Participantes e Status da Presença
          </label>
          
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const currentStatus = participantStatuses[m.id] || 'participando';
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-black/30 border border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{m.avatar}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{m.name}</span>
                      <span className="text-3xs text-brand-text-muted font-semibold">{m.role}</span>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 shrink-0 bg-black/40 p-1 rounded-xl border border-brand-border/40">
                    {(['participando', 'ausente', 'convidado'] as ParticipantStatus[]).map((st) => {
                      const isActive = currentStatus === st;
                      const labels = {
                        participando: 'Participando',
                        ausente: 'Ausente',
                        convidado: 'Convidado',
                      };
                      const activeStyles = {
                        participando: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
                        ausente: 'bg-white/10 text-brand-text-muted border-white/20',
                        convidado: 'bg-brand-purple/30 text-brand-purple-light border-brand-purple/60',
                      };

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(m.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold transition-all border cursor-pointer ${
                            isActive
                              ? activeStyles[st]
                              : 'bg-transparent text-brand-text-muted border-transparent hover:text-white'
                          }`}
                        >
                          {labels[st]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Observações / Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Observações / Anotações
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Levar fones sem fio, playlist pensada para estrada..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-brand-border/60 text-xs text-white placeholder:text-brand-text-muted focus:outline-none focus:border-amber-400 transition-all resize-none"
          />
        </div>

        {/* Objective */}
        <Input
          label="Objetivo da Experiência"
          placeholder="Ex: Relaxar após a semana, Animar a festa, Focar nos estudos"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />

        {/* Mood Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
            Mood / Vibe
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Festa & Alegria', 'Foco & Trabalho', 'Relax & Calma', 'Viagem', 'Nostalgia'].map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    mood === m
                      ? 'bg-brand-cyan text-brand-surface font-black'
                      : 'bg-black/30 border border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  {m}
                </button>
              )
            )}
          </div>
        </div>

        {/* Cover Picker */}
        <AvatarSelector
          selectedAvatar={cover}
          onSelectAvatar={(av) => setCover(av)}
        />

        {/* Color Picker */}
        <ColorSelector
          selectedColor={color}
          onSelectColor={(col) => setColor(col)}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border/40">
          <Button type="button" onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" glow>
            Iniciar Sessão Planejada
          </Button>
        </div>

      </form>
    </Modal>
  );
};

