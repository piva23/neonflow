import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { usePlaylist, useProfile } from '../../hooks';
import { CreatePlaylistInput } from '../../services/playlistService';
import { PlaylistCoverType, PlaylistVisibility } from '../../types';
import { MOOD_DEFINITIONS } from '../../utils/playlistHelpers';
import { toast } from 'react-hot-toast';
import { Sparkles, Image, Palette, Grid, Tag, Flame, Lock, Users, Globe } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GRADIENT_PRESETS = [
  { label: 'Cyber Neon', value: 'from-purple-600 via-fuchsia-600 to-pink-600' },
  { label: 'Sunset Glow', value: 'from-pink-600 via-rose-600 to-amber-600' },
  { label: 'Deep Ocean', value: 'from-blue-600 via-indigo-600 to-purple-800' },
  { label: 'Aurora Night', value: 'from-emerald-600 via-teal-600 to-cyan-700' },
  { label: 'Golden Hours', value: 'from-amber-500 via-orange-600 to-red-600' },
  { label: 'Midnight Blue', value: 'from-slate-900 via-indigo-950 to-blue-900' },
];

const EMOJI_OPTIONS = ['🎵', '🎧', '🎸', '🎹', '⚡', '🔥', '🌟', '🚗', '☕', '💤', '🎮', '🏠', '🚀', '💖', '🎉', '🌴'];

const TAG_PRESETS = ['Viagem', 'Churrasco', 'Fim de Semana', 'Estudos', 'Treino', 'Infantil', 'Clássicos', 'Anos 80', 'Festa'];

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createPlaylist } = usePlaylist();
  const { activeProfile } = useProfile();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverType, setCoverType] = useState<PlaylistCoverType>('gradient');
  const [coverGradient, setCoverGradient] = useState(GRADIENT_PRESETS[0].value);
  const [coverSolidColor, setCoverSolidColor] = useState('#7b2cbf');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [icon, setIcon] = useState('🎵');
  const [mood, setMood] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [visibility, setVisibility] = useState<PlaylistVisibility>('family');

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Informe o nome da playlist!');
      return;
    }

    if (!activeProfile) {
      toast.error('Nenhum perfil ativo selecionado.');
      return;
    }

    let finalCover = coverGradient;
    if (coverType === 'solid') finalCover = coverSolidColor;
    if (coverType === 'image') finalCover = coverImageUrl.trim();
    if (coverType === 'mosaic') finalCover = 'mosaic';

    const input: CreatePlaylistInput = {
      name: name.trim(),
      description: description.trim(),
      cover: finalCover,
      coverType,
      coverColor: coverGradient,
      color: coverType === 'solid' ? coverSolidColor : '#7b2cbf',
      icon,
      tags: selectedTags,
      mood: mood || undefined,
      type: visibility === 'family' ? 'family' : 'personal',
      visibility,
      isFamilyShared: visibility === 'family',
      createdBy: activeProfile.id,
      owner: activeProfile.id,
    };

    createPlaylist(input);
    toast.success(`Playlist "${name}" criada com sucesso!`);

    // Reset
    setName('');
    setDescription('');
    setCoverType('gradient');
    setCoverGradient(GRADIENT_PRESETS[0].value);
    setCoverImageUrl('');
    setIcon('🎵');
    setMood('');
    setSelectedTags([]);
    setVisibility('family');

    onClose();
    onSuccess?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Playlist">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
        
        {/* Name & Description */}
        <Input
          label="Nome da Playlist *"
          placeholder="Ex: Músicas para a Estrada"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Descrição"
          placeholder="Ex: As favoritas das crianças e adultos para ouvir na viagem..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Visibility Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
            Visibilidade na Casa
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('family')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left
                ${visibility === 'family'
                  ? 'bg-brand-purple/20 border-brand-purple text-white'
                  : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                }
              `}
            >
              <Users className="w-5 h-5 text-brand-purple-light shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Família (Compartilhada)</div>
                <div className="text-[10px] text-brand-text-muted">Todos na casa podem ver e tocar.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left
                ${visibility === 'private'
                  ? 'bg-brand-purple/20 border-brand-purple text-white'
                  : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                }
              `}
            >
              <Lock className="w-5 h-5 text-brand-cyan shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Privada (Pessoal)</div>
                <div className="text-[10px] text-brand-text-muted">Visível apenas no seu perfil.</div>
              </div>
            </button>
          </div>
        </div>

        {/* Emoji Icon Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
            Ícone / Emoji
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-brand-surface border border-brand-border rounded-xl">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer
                  ${icon === e ? 'bg-brand-purple/30 border border-brand-purple scale-110 shadow-md' : 'hover:bg-white/5'}
                `}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Cover Type Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
            Estilo da Capa
          </label>

          <div className="flex gap-2 border-b border-brand-border/40 pb-2">
            <button
              type="button"
              onClick={() => setCoverType('gradient')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer
                ${coverType === 'gradient' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'}
              `}
            >
              <Palette className="w-3.5 h-3.5" /> Gradiente
            </button>
            <button
              type="button"
              onClick={() => setCoverType('mosaic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer
                ${coverType === 'mosaic' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'}
              `}
            >
              <Grid className="w-3.5 h-3.5" /> Mosaico
            </button>
            <button
              type="button"
              onClick={() => setCoverType('solid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer
                ${coverType === 'solid' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'}
              `}
            >
              Cor Sólida
            </button>
            <button
              type="button"
              onClick={() => setCoverType('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer
                ${coverType === 'image' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'}
              `}
            >
              <Image className="w-3.5 h-3.5" /> Imagem URL
            </button>
          </div>

          {coverType === 'gradient' && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setCoverGradient(g.value)}
                  className={`h-12 rounded-xl bg-gradient-to-br ${g.value} border-2 relative transition-all cursor-pointer flex items-center justify-center text-white text-xs font-bold shadow-md
                    ${coverGradient === g.value ? 'border-white scale-105 shadow-purple-500/30' : 'border-transparent opacity-70 hover:opacity-100'}
                  `}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {coverType === 'solid' && (
            <div className="flex items-center gap-3 pt-1">
              <input
                type="color"
                value={coverSolidColor}
                onChange={(e) => setCoverSolidColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-brand-border bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white font-bold uppercase">{coverSolidColor}</span>
            </div>
          )}

          {coverType === 'image' && (
            <Input
              placeholder="Cole a URL da imagem da capa (http://...)"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          )}

          {coverType === 'mosaic' && (
            <p className="text-xs text-brand-text-muted italic bg-brand-surface p-3 rounded-xl border border-brand-border/60">
              O mosaico será montado automaticamente com as capas das 4 primeiras músicas adicionadas a esta playlist.
            </p>
          )}
        </div>

        {/* Mood Category */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-brand-pink" /> Mood / Clima
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MOOD_DEFINITIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(mood === m.name ? '' : m.name)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer
                  ${mood === m.name
                    ? 'bg-brand-pink/20 border-brand-pink text-white'
                    : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                  }
                `}
              >
                <span>{m.icon}</span>
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-brand-cyan" /> Tags de Organização
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TAG_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => (selectedTags.includes(t) ? handleRemoveTag(t) : handleAddTag(t))}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer
                  ${selectedTags.includes(t)
                    ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
                    : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                  }
                `}
              >
                #{t}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Adicionar tag personalizada..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(customTagInput);
                  setCustomTagInput('');
                }
              }}
              className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-purple"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                handleAddTag(customTagInput);
                setCustomTagInput('');
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Form CTA Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border/40">
          <Button type="button" onClick={onClose} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" glow>
            <Sparkles className="w-4 h-4" /> Criar Playlist
          </Button>
        </div>

      </form>
    </Modal>
  );
};
