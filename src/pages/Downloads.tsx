import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Music,
  ArrowRight,
  Filter,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { PageHeader, Card, Button, GlassCard, EmptyState } from '../components';
import { downloadManager, DownloadTask, ProviderFactory } from '../core/download';
import toast from 'react-hot-toast';

export const Downloads: React.FC = () => {
  const [tasks, setTasks] = useState<Map<string, DownloadTask>>(new Map());
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [storageUsage, setStorageUsage] = useState({
    usedMB: 0,
    quotaMB: 2048,
    percentage: 0,
    localTracksCount: 0,
  });

  const loadUsage = async () => {
    const data = await downloadManager.getStorageUsage();
    setStorageUsage({
      usedMB: Math.round(data.usedBytes / (1024 * 1024)),
      quotaMB: Math.round(data.quotaBytes / (1024 * 1024)),
      percentage: data.percentage,
      localTracksCount: data.localTracksCount,
    });
  };

  useEffect(() => {
    loadUsage();
    const unsubscribe = downloadManager.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
      loadUsage();
    });
    return unsubscribe;
  }, []);

  const taskList: DownloadTask[] = (Array.from(tasks.values()) as DownloadTask[]).sort((a, b) => b.startedAt - a.startedAt);

  const filteredTasks = taskList.filter((task) => {
    if (filter === 'active') return ['Waiting', 'Preparing', 'Downloading', 'Processing', 'Importing'].includes(task.status);
    if (filter === 'completed') return task.status === 'Completed';
    if (filter === 'failed') return task.status === 'Failed' || task.status === 'Cancelled';
    return true;
  });

  const activeProvider = ProviderFactory.getActiveProvider();

  const handleCancel = (trackId: string) => {
    downloadManager.cancelDownload(trackId);
  };

  const handleDelete = async (trackId: string) => {
    await downloadManager.deleteOfflineTrack(trackId);
    loadUsage();
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja apagar todos os arquivos baixados offline?')) {
      await downloadManager.clearAllDownloads();
      loadUsage();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <PageHeader
        title="Gerenciador de Downloads Offline"
        description="Fila de conversão YouTube → MP3, armazenamento local no IndexedDB e status dos arquivos"
        actionSlot={
          <div className="flex items-center gap-3">
            <Link to="/biblioteca">
              <Button variant="secondary" className="text-xs flex items-center gap-2">
                <Music className="w-4 h-4 text-brand-purple-light" />
                <span>Abrir Biblioteca</span>
              </Button>
            </Link>
            {taskList.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="danger"
                className="text-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Tudo</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Storage and Provider Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xs font-bold text-brand-text-muted uppercase tracking-wider block">
              Espaço Utilizado
            </span>
            <div className="text-lg font-black text-white mt-0.5">
              {storageUsage.usedMB} MB <span className="text-xs text-brand-text-muted font-normal">/ {storageUsage.quotaMB} MB</span>
            </div>
            <div className="w-32 bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-brand-purple h-full rounded-full"
                style={{ width: `${storageUsage.percentage}%` }}
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xs font-bold text-brand-text-muted uppercase tracking-wider block">
              Músicas Offlines
            </span>
            <div className="text-lg font-black text-white mt-0.5">
              {storageUsage.localTracksCount} faixas
            </div>
            <span className="text-2xs text-emerald-400 font-bold mt-0.5 block">
              Tocando localmente sem internet
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xs font-bold text-brand-text-muted uppercase tracking-wider block">
              Provedor Ativo
            </span>
            <div className="text-xs font-black text-white mt-0.5 truncate max-w-[140px]">
              {activeProvider.getName()}
            </div>
            <span className="text-3xs text-brand-text-muted block mt-1">
              Engine de Conversão
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xs font-bold text-brand-text-muted uppercase tracking-wider block">
              Fila de Tarefas
            </span>
            <div className="text-lg font-black text-white mt-0.5">
              {taskList.filter((t) => ['Waiting', 'Preparing', 'Downloading', 'Processing', 'Importing'].includes(t.status)).length} em andamento
            </div>
            <span className="text-3xs text-brand-text-muted block mt-0.5">
              Troca automática YouTube → Local
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
        <span className="text-xs font-extrabold text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filtrar:
        </span>

        {[
          { id: 'all', label: 'Todas' },
          { id: 'active', label: 'Em Andamento' },
          { id: 'completed', label: 'Concluídas' },
          { id: 'failed', label: 'Erros / Cancelados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-brand-purple text-white shadow-md'
                : 'bg-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Downloads Queue List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<Download className="w-8 h-8 text-brand-purple-light" />}
            title="Nenhum download encontrado"
            description="Vá até a Biblioteca e clique no botão '⬇ Download Offline' nas faixas do YouTube para salvar no IndexedDB."
            action={
              <Link to="/biblioteca">
                <Button variant="primary" glow className="text-xs">
                  Ir para a Biblioteca <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          />
        ) : (
          filteredTasks.map((task) => {
            const isRunning = ['Waiting', 'Preparing', 'Downloading', 'Processing', 'Importing'].includes(task.status);
            return (
              <GlassCard
                key={task.trackId}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-purple/40 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {task.thumbnail ? (
                    <img
                      src={task.thumbnail}
                      alt={task.trackTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple-light font-black shrink-0">
                      MP3
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white truncate">{task.trackTitle}</h4>
                      <span className={`text-3xs font-extrabold px-2 py-0.5 rounded-full border ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isRunning
                          ? 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/40 animate-pulse'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-text-muted truncate mt-0.5">
                      {task.artist} • Provedor: {task.providerName}
                    </p>

                    {/* Progress bar if running */}
                    {isRunning && (
                      <div className="mt-2 space-y-1 max-w-md">
                        <div className="flex justify-between text-3xs font-bold text-brand-text-muted">
                          <span>{task.status}...</span>
                          <span className="text-brand-purple-light">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-brand-purple to-brand-cyan h-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isRunning ? (
                    <Button
                      onClick={() => handleCancel(task.trackId)}
                      variant="secondary"
                      className="text-xs text-red-400 hover:text-red-300 border-red-500/30"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleDelete(task.trackId)}
                      variant="secondary"
                      className="text-xs hover:bg-red-500/10 text-brand-text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
