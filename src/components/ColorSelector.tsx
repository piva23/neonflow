import React, { useState } from 'react';
import { Check, Pipette } from 'lucide-react';

interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  label?: string;
}

const CIRCLE_PRESETS = [
  { name: 'Vermelho Neon', hex: '#ef4444', emoji: '🔴' },
  { name: 'Laranja Elétrico', hex: '#f97316', emoji: '🟠' },
  { name: 'Amarelo Sol', hex: '#eab308', emoji: '🟡' },
  { name: 'Verde Esmeralda', hex: '#22c55e', emoji: '🟢' },
  { name: 'Azul Neon', hex: '#3b82f6', emoji: '🔵' },
  { name: 'Roxo Elétrico', hex: '#8338ec', emoji: '🟣' },
  { name: 'Rosa Shocking', hex: '#ff006e', emoji: '💖' },
  { name: 'Ciano Vibrante', hex: '#06b6d4', emoji: '🩵' },
  { name: 'Preto Ônix', hex: '#18181b', emoji: '⚫' },
  { name: 'Branco Pérola', hex: '#f4f4f5', emoji: '⚪' },
  { name: 'Menta Fresca', hex: '#06d6a0', emoji: '🌿' },
  { name: 'Magenta Pink', hex: '#f72585', emoji: '🌺' },
];

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
  label = 'Cor do Tema / Perfil',
}) => {
  const [customHex, setCustomHex] = useState(selectedColor || '#8338ec');

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    onSelectColor(val);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
          {label}
        </span>
        <span
          className="text-3xs font-mono font-bold px-2 py-0.5 rounded-md border text-white"
          style={{
            backgroundColor: `${selectedColor}30`,
            borderColor: `${selectedColor}80`,
          }}
        >
          {selectedColor.toUpperCase()}
        </span>
      </div>

      {/* Preset Circles Row */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-black/40 border border-brand-border/60">
        {CIRCLE_PRESETS.map((item) => {
          const isSelected = selectedColor.toLowerCase() === item.hex.toLowerCase();
          return (
            <button
              key={item.hex}
              type="button"
              onClick={() => onSelectColor(item.hex)}
              title={item.name}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'ring-4 ring-white ring-offset-2 ring-offset-black scale-115 shadow-xl shadow-white/20 animate-pulse z-10'
                  : 'opacity-80 hover:opacity-100 hover:scale-105 border border-white/20'
              }`}
              style={{ backgroundColor: item.hex }}
            >
              {isSelected && (
                <Check className={`w-4 h-4 ${item.hex === '#f4f4f5' ? 'text-black' : 'text-white'} drop-shadow stroke-[3]`} />
              )}
            </button>
          );
        })}

        {/* Custom Native Color Picker */}
        <div className="relative flex items-center gap-1 pl-2 border-l border-white/10">
          <label
            htmlFor="custom-color-picker"
            className="w-9 h-9 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center cursor-pointer hover:border-white transition-colors bg-white/5"
            title="Escolher Cor Customizada"
          >
            <Pipette className="w-4 h-4 text-brand-text-muted hover:text-white" />
            <input
              id="custom-color-picker"
              type="color"
              value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#8338ec'}
              onChange={handleCustomChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

