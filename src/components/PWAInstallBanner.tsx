import React from 'react';
import { usePWA } from '../contexts/PWAContext';
import { Download, RefreshCw, WifiOff, X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from './Button';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isOnline,
    needRefresh,
    promptInstall,
    updateServiceWorker,
    dismissInstallPrompt,
    isPromptDismissed,
  } = usePWA();

  return (
    <>
      {/* 1. Offline Toast Bar */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-red-500/90 text-white text-xs font-bold shadow-xl border border-red-400/50 backdrop-blur-md flex items-center gap-2 animate-bounce">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Modo Offline (Cached Shell Ativo)</span>
        </div>
      )}

      {/* 2. Service Worker Update Notification Banner */}
      {needRefresh && (
        <div className="fixed bottom-24 right-4 z-[90] max-w-sm p-4 rounded-2xl bg-[#121324]/95 border border-brand-purple/60 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 text-white animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-purple/30 border border-brand-purple/60 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Nova Versão Disponível!</h4>
                <p className="text-3xs text-brand-text-muted font-medium">
                  Atualize o NeonFlow para aplicar melhorias de performance.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="glow"
              onClick={updateServiceWorker}
              className="text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar Agora
            </Button>
          </div>
        </div>
      )}

      {/* 3. PWA Install Prompt Banner */}
      {isInstallable && !isInstalled && !isPromptDismissed && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[85] p-4 rounded-2xl bg-[#0d0e1b]/95 border border-brand-cyan/50 shadow-2xl backdrop-blur-xl flex flex-col gap-3 text-white animate-slide-up">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-cyan/30 to-brand-purple/30 border border-brand-cyan/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-brand-cyan" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  Instalar NeonFlow App
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                    PWA
                  </span>
                </h4>
                <p className="text-3xs text-brand-text-muted font-medium mt-0.5">
                  Instale na tela inicial para reprodução sem distrações e acesso rápido offline.
                </p>
              </div>
            </div>
            <button
              onClick={dismissInstallPrompt}
              className="p-1 rounded-lg text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
            <button
              onClick={dismissInstallPrompt}
              className="px-3 py-1.5 rounded-xl text-3xs font-extrabold text-brand-text-muted hover:text-white transition-colors"
            >
              Agora Não
            </button>
            <Button
              size="sm"
              variant="glow"
              onClick={promptInstall}
              className="text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar Aplicativo
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
