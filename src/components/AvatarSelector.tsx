import React, { useState } from 'react';
import {
  Check,
  Smile,
  Sparkles,
  Image as ImageIcon,
  Headphones,
  Disc,
  Guitar,
  Mic,
  Music,
  Radio,
  Speaker,
  Crown,
  Star,
  Heart,
  Flame,
  Shield,
  User,
  Users,
  Tv,
  Volume2,
  Trophy,
  Compass,
  Waves,
} from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

const EMOJI_PRESETS = [
  '👨‍🎤', '👩‍🎤', '🎧', '🦄', '👵', '👴', '🕺', '💃',
  '🎸', '🎹', '🎨', '🚀', '🐻', '🦁', '👑', '👾',
  '🤖', '🦸‍♂️', '🦸‍♀️', '🌟', '🎶', '🎷', '🎺', '🎤',
  '🔥', '⚡', '💎', '🏠', '🎵', '🎼', '🔊', '🎙️'
];

export const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Headphones,
  Disc,
  Guitar,
  Mic,
  Music,
  Radio,
  Speaker,
  Crown,
  Star,
  Heart,
  Flame,
  Shield,
  Sparkles,
  Smile,
  User,
  Users,
  Tv,
  Volume2,
  Trophy,
  Compass,
  Waves,
};

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelectAvatar,
}) => {
  const isIcon = selectedAvatar.startsWith('icon:');
  const iconName = isIcon ? selectedAvatar.replace('icon:', '') : '';

  const [activeTab, setActiveTab] = useState<'emoji' | 'icon' | 'url'>(
    isIcon ? 'icon' : selectedAvatar.startsWith('http') ? 'url' : 'emoji'
  );
  const [customUrlInput, setCustomUrlInput] = useState(
    selectedAvatar.startsWith('http') ? selectedAvatar : ''
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlInput.trim()) {
      onSelectAvatar(customUrlInput.trim());
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('emoji')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'emoji'
              ? 'bg-brand-purple text-white shadow-md'
              : 'text-brand-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Smile className="w-3.5 h-3.5" /> Emoji
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('icon')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'icon'
              ? 'bg-brand-purple text-white shadow-md'
              : 'text-brand-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" /> Ícone
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-brand-purple text-white shadow-md'
              : 'text-brand-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Avatar / URL
        </button>
      </div>

      {/* Tab 1: Emoji Grid */}
      {activeTab === 'emoji' && (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-black/40 rounded-2xl border border-brand-border/60 max-h-48 overflow-y-auto">
          {EMOJI_PRESETS.map((emoji) => {
            const isSelected = selectedAvatar === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelectAvatar(emoji)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-brand-purple/40 border-2 border-brand-purple shadow-lg shadow-brand-purple/30 scale-105'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span>{emoji}</span>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan text-black rounded-full flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Lucide Icon Grid */}
      {activeTab === 'icon' && (
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 p-2.5 bg-black/40 rounded-2xl border border-brand-border/60 max-h-48 overflow-y-auto">
          {Object.entries(ICON_MAP).map(([key, IconComponent]) => {
            const isSelected = selectedAvatar === `icon:${key}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectAvatar(`icon:${key}`)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-brand-purple/40 border-2 border-brand-purple text-brand-purple-light shadow-lg shadow-brand-purple/30 scale-105'
                    : 'bg-white/5 border border-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                }`}
                title={key}
              >
                <IconComponent className="w-5 h-5" />
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-cyan text-black rounded-full flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 3: Custom URL Input */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2 p-3 bg-black/40 rounded-2xl border border-brand-border/60">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cole a URL de uma imagem..."
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="flex-1 bg-black/60 border border-brand-border/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple-light transition-colors cursor-pointer"
            >
              Aplicar
            </button>
          </div>
          <span className="text-3xs text-brand-text-muted">
            Suporta links de imagens JPG, PNG ou SVG da internet.
          </span>
        </form>
      )}

      {/* Real-time Avatar Preview */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface/60 border border-brand-border/60">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
          Preview Selecionado:
        </span>
        <div className="w-10 h-10 rounded-xl bg-black/60 border border-brand-purple/40 flex items-center justify-center text-xl overflow-hidden shadow-inner shrink-0">
          {selectedAvatar.startsWith('http') ? (
            <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : selectedAvatar.startsWith('icon:') ? (
            (() => {
              const name = selectedAvatar.replace('icon:', '');
              const IconComp = ICON_MAP[name] || Headphones;
              return <IconComp className="w-5 h-5 text-brand-purple-light" />;
            })()
          ) : (
            selectedAvatar || '🎧'
          )}
        </div>
      </div>
    </div>
  );
};

