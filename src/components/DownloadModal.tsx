import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, AlertCircle, X, Loader2, ArrowDownCircle, HardDrive, Cpu, Server, Save } from 'lucide-react';
import { Track } from '../types';
import { downloadManager, DownloadTask, ProviderFactory } from '../core/download';
import { Button } from './Button';
import toast from 'react-hot-toast';
import { saveFileToDisk } from '../utils/fileSystemHelpers';
import { mediaStorage } from '../core/media';
import { LocalSynthesizerProvider } from '../core/download/providers/LocalSynthesizerProvider';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track | null;
  onTrackUpdated?: (track: Track) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  track,
  onTrackUpdated,
}) => {
  const [tasks, setTasks] = useState<Map<string, DownloadTask>>(new Map());
  const [storageEstimate, setStorageEstimate] = useState<{ freeMB: number; usedMB: number } | null>(null);

  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const quota = est.quota || 1024 * 1024 * 1024 * 2;
        const usage = est.usage || 0;
        setStorageEstimate({
          freeMB: Math.round((quota - usage) / (1024 * 1024)),
          usedMB: Math.round(usage / (1024 * 1024)),
        });
      });
    }

    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const currentTask = track ? tasks.get(track.id) : undefined;
  const allQueue = Array.from(tasks.values());
  const activeProvider = ProviderFactory.getActiveProvider();

  const estimatedSizeMB = track?.duration ? ((track.duration * 320) / (8 * 1024)).toFixed(1) : '4.5';

  const handleSaveToDisk = async () => {
    if (!track) return;
    try {
      const record = await mediaStorage.getRecordByTrackId(track.id);
      if (record && record.fileBlob) {
        await saveFileToDisk(record.fileBlob, `${track.artist} - ${track.title}.mp3`);
      } else {
        toast.loading('Gerando áudio MP3 para exportação...');
        const synth = new LocalSynthesizerProvider();
        const blob = await synth.startDownload(track);
        toast.dismiss();
        await saveFileToDisk(blob, `${track.artist} - ${track.title}.mp3`);
      }
    } catch (err) {
      console.error('[DownloadModal] Erro ao salvar no disco:', err);
      toast.error('Erro ao salvar o arquivo no dispositivo.');
    }
  };

  const handleStartDownload = async () => {
    if (!track) return;
    const success = await downloadManager.startDownload(track, (updatedTrack) => {
      if (onTrackUpdated) onTrackUpdated(updatedTrack);
    });
    if (!success && !currentTask) {
      toast.error('Não foi possível iniciar o download.');
    }
  };

  const handleCancel = (trackId: string) => {
    downloadManager.cancelDownload(trackId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-brand-surface border border-brand-border/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-brand-border/60 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-purple/20 border border-brand-purple/40 text-brand-purple-light">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Download Offline para IndexedDB</h3>
              <p className="text-2xs text-brand-text-muted">
                Converte a faixa do YouTube e armazena o áudio no dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-text-muted hover:text-white rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Target Track Section if provided */}
          {track && (
            <div className="bg-black/40 border border-brand-border/60 p-4 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                {track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple-light font-black shrink-0">
                    MP3
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-3xs font-extrabold uppercase tracking-wider text-brand-purple-light">
                    Música Solicitada
                  </span>
                  <h4 className="text-sm font-black text-white truncate mt-0.5">{track.title}</h4>
                  <p className="text-xs text-brand-text-muted truncate">{track.artist}</p>
                </div>
              </div>

              {/* Technical Download Specs */}
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5 text-2xs">
                <div>
                  <span className="text-brand-text-muted block text-3xs font-bold uppercase">Tamanho Est.</span>
                  <span className="font-extrabold text-white">~{estimatedSizeMB} MB</span>
                </div>
                <div>
                  <span className="text-brand-text-muted block text-3xs font-bold uppercase">Espaço Livre</span>
                  <span className="font-extrabold text-emerald-400">
                    {storageEstimate ? `${storageEstimate.freeMB} MB` : 'Calculando...'}
                  </span>
                </div>
                <div>
                  <span className="text-brand-text-muted block text-3xs font-bold uppercase">Provedor Ativo</span>
                  <span className="font-bold text-brand-cyan truncate block">{activeProvider.getName()}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {track.source?.type === 'local' ? (
                  <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Disponível Offline em IndexedDB 💾
                  </span>
                ) : (
                  <Button
                    onClick={handleStartDownload}
                    disabled={['Downloading', 'Preparing', 'Processing', 'Importing'].includes(currentTask?.status || '')}
                    variant="primary"
                    glow
                    className="text-xs flex-1 justify-center"
                  >
                    {['Downloading', 'Preparing', 'Processing', 'Importing'].includes(currentTask?.status || '') ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processando Conversão...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Baixar Offline
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleSaveToDisk}
                  variant="secondary"
                  className="text-xs bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 justify-center flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-cyan-400" /> Salvar no Disco MP3
                </Button>
              </div>

              {/* Status Progress Bar if task active */}
              {currentTask && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-2xs font-bold">
                    <span className="text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-brand-purple animate-spin" />
                      Status: <strong className="text-white">{currentTask.status}</strong>
                    </span>
                    <span className="text-white font-extrabold">{currentTask.progress}%</span>
                  </div>

                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentTask.status === 'Completed'
                          ? 'bg-emerald-500'
                          : currentTask.status === 'Failed' || currentTask.status === 'Cancelled'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-brand-purple to-brand-cyan animate-pulse'
                      }`}
                      style={{ width: `${currentTask.progress}%` }}
                    />
                  </div>

                  {['Downloading', 'Preparing', 'Processing', 'Importing'].includes(currentTask.status) && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCancel(track.id)}
                        className="text-3xs text-red-400 hover:text-red-300 underline cursor-pointer font-bold"
                      >
                        Cancelar Download
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Queue & History of Downloads */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-purple" /> Histórico de Downloads
            </h4>

            {allQueue.length === 0 ? (
              <div className="p-6 text-center bg-black/20 rounded-2xl border border-white/5 space-y-2">
                <ArrowDownCircle className="w-8 h-8 text-brand-text-muted mx-auto opacity-40" />
                <p className="text-xs text-brand-text-muted font-medium">
                  Nenhum download ativo ou recente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {allQueue.map((item: DownloadTask) => (
                  <div
                    key={item.trackId}
                    className="p-3 bg-black/30 border border-brand-border/40 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-white truncate">{item.trackTitle}</h5>
                      <p className="text-3xs text-brand-text-muted truncate">{item.artist} • {item.providerName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'Completed' && (
                        <span className="text-3xs bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40">
                          Pronta 💾
                        </span>
                      )}
                      {['Downloading', 'Preparing', 'Processing', 'Importing'].includes(item.status) && (
                        <div className="flex items-center gap-2">
                          <span className="text-3xs font-extrabold text-brand-purple-light">
                            {item.progress}%
                          </span>
                          <button
                            onClick={() => handleCancel(item.trackId)}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {(item.status === 'Failed' || item.status === 'Cancelled') && (
                        <span className="text-3xs bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/40">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brand-border/60 bg-black/40 flex items-center justify-end">
          <Button onClick={onClose} variant="secondary" className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
