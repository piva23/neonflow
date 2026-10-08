import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  RefreshCw,
  Palette,
  Save,
  Check,
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  HardDrive,
  Database,
  Trash2,
  Search,
  Upload,
  FileJson,
  Radio,
  Sliders,
  Sparkles,
  Music,
  Clock,
  ShieldAlert,
  FolderArchive,
  Volume2,
  Sun,
  Moon,
  Zap,
  FolderSync,
  Server,
} from 'lucide-react';
import { ProviderFactory } from '../core/download';
import { useSession, useTheme, useProfile, usePlaylist } from '../hooks';
import { usePWA } from '../contexts/PWAContext';
import { PageHeader, Button, Input, GlassCard, SectionTitle } from '../components';
import { getThemeColors } from '../utils/themeHelpers';
import { toast } from 'react-hot-toast';
import { NeonThemeMode, BaseThemeStyle } from '../contexts/ThemeContext';
import { mediaCache, mediaStorage, mediaLibrary } from '../core/media';
import { MusicRepository, PlaylistRepository } from '../repositories';
import { storage } from '../services/storage';

export const Configuracoes: React.FC = () => {
  const { family, updateFamilyName, regenerateInviteCode, resetAllData } = useSession();
  const { activeTheme, setThemeMode, themeStyle, setThemeStyle, glowEnabled, toggleGlow } = useTheme();
  const { activeProfile } = useProfile();
  const { globalTracks } = usePlaylist();
  const { isInstallable, isInstalled, isOnline, promptInstall, updateServiceWorker, needRefresh } = usePWA();

  // Local reload function that re-reads tracks from the repository
  const reloadLibrary = () => {
    // Force a re-render by triggering a state update via a dummy dependency
    window.dispatchEvent(new Event('storage'));
  };

  const themeColors = getThemeColors(activeTheme);

  // Local Form states
  const [fName, setFName] = useState(family.familyName);

  // Storage & Stats State
  const [storageStats, setStorageStats] = useState<{ usedBytes: number; quotaBytes: number }>({
    usedBytes: 0,
    quotaBytes: 1024 * 1024 * 1024 * 2, // 2GB fallback
  });
  const [isScanning, setIsScanning] = useState(false);

  // Playback Preferences
  const [sourcePref, setSourcePref] = useState<'auto' | 'mp3' | 'youtube'>(() => {
    return storage.load<'auto' | 'mp3' | 'youtube'>('playback_source_preference', 'auto');
  });
  const [qualityPref, setQualityPref] = useState<'high' | 'medium' | 'low'>(() => {
    return storage.load<'high' | 'medium' | 'low'>('playback_quality_preference', 'high');
  });

  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Fetch storage stats on load
  const loadStats = async () => {
    try {
      const stats = await mediaCache.getStorageUsage();
      setStorageStats(stats);
    } catch (err) {
      console.error('[Configuracoes] Erro ao carregar estatísticas:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [globalTracks]);

  // Total Duration Calculation
  const totalDurationSeconds = globalTracks.reduce((acc, t) => acc + (t.duration || 210), 0);
  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

  // Format Bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveFamilyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) {
      toast.error('O nome da família não pode estar vazio!');
      return;
    }
    updateFamilyName(fName.trim());
    toast.success('Nome da família atualizado com sucesso!');
  };

  const handleRegenInvite = () => {
    if (
      window.confirm(
        'Tem certeza de que deseja invalidar o código atual e gerar um novo? Seus familiares precisarão do novo código para entrar.'
      )
    ) {
      regenerateInviteCode();
      toast.success('Código de convite atualizado!');
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        '⚠️ ATENÇÃO: Deseja redefinir TODAS as músicas cadastradas, playlists e pontuações de perfis da sua casa de volta ao estado inicial? Esta ação é irreversível.'
      )
    ) {
      resetAllData();
      toast.success('Banco de dados restaurado!');
    }
  };

  const handleHardReset = async () => {
    if (
      window.confirm(
        '⚠️ HARD RESET (DEBUG): Deseja ZERAR E LIMPAR completamente todo o armazenamento local (localStorage e IndexedDB)? O aplicativo voltará 100% vazio e a página será recarregada.'
      )
    ) {
      try {
        await mediaStorage.clearAll();
      } catch (err) {
        console.warn('Erro ao limpar mediaStorage:', err);
      }
      try {
        localStorage.clear();
      } catch (err) {
        console.warn('Erro ao limpar localStorage:', err);
      }
      toast.success('Banco de dados local zerado com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 250);
    }
  };

  // CACHE ACTIONS
  const handleClearCache = () => {
    mediaCache.clearObjectUrlCache();
    toast.success('Cache de ObjectURLs revogado e liberado da memória! 🧹');
    loadStats();
  };

  const handleRebuildCache = async () => {
    const loadingToast = toast.loading('Reconstruindo cache de mídia local...');
    mediaCache.clearObjectUrlCache();
    await loadStats();
    toast.dismiss(loadingToast);
    toast.success('Cache de mídia local reconstruído com sucesso! ⚡');
  };

  const handleScanOrphans = async () => {
    setIsScanning(true);
    const loadingToast = toast.loading('Escaneando banco local em busca de arquivos órfãos...');
    try {
      const activeIds = globalTracks.map((t) => t.id);
      const result = await mediaLibrary.scanAndClean(activeIds);
      toast.dismiss(loadingToast);
      toast.success(
        `Escaneamento concluído! ${result.scannedCount} registro(s) verificado(s), ${result.orphanedCount} órfão(s) limpo(s). 🔍`
      );
      await loadStats();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao escanear arquivos órfãos.');
    } finally {
      setIsScanning(false);
    }
  };

  // DOWNLOADS ACTIONS
  const handleClearDownloads = async () => {
    if (
      !window.confirm(
        'Tem certeza de que deseja apagar todos os arquivos baixados localmente? As músicas continuarão cadastradas, mas serão reproduzidas via streaming.'
      )
    ) {
      return;
    }

    const loadingToast = toast.loading('Limpando downloads locais...');
    try {
      await mediaStorage.clearAll();
      mediaCache.clearObjectUrlCache();

      // Reset local source tracks to default youtube
      const allTracks = MusicRepository.getAll();
      allTracks.forEach((t) => {
        if (t.source?.type === 'local') {
          MusicRepository.updateTrack(t.id, {
            source: { type: 'youtube' },
          });
        }
      });

      reloadLibrary();
      await loadStats();
      toast.dismiss(loadingToast);
      toast.success('Todos os downloads foram removidos do IndexedDB! 🗑️');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao limpar downloads.');
    }
  };

  const handleExportLibrary = () => {
    try {
      const exportData = {
        app: 'NeonFlow',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        family: family.familyName,
        tracks: MusicRepository.getAll(),
        playlists: PlaylistRepository.getAll(),
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `neonflow_backup_${family.familyName.toLowerCase().replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup da biblioteca exportado com sucesso! 📦');
    } catch (err) {
      toast.error('Erro ao exportar biblioteca.');
    }
  };

  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.tracks || !Array.isArray(parsed.tracks)) {
          throw new Error('Formato de backup inválido.');
        }

        const confirmMsg = `Deseja importar ${parsed.tracks.length} música(s) e ${
          parsed.playlists?.length || 0
        } playlist(s)?`;
        if (!window.confirm(confirmMsg)) return;

        // Import tracks
        parsed.tracks.forEach((track: any) => {
          MusicRepository.addDirectTrack(track);
        });

        // Import playlists if present
        if (parsed.playlists && Array.isArray(parsed.playlists)) {
          parsed.playlists.forEach((pl: any) => {
            PlaylistRepository.create({
              name: pl.name,
              description: pl.description,
              cover: pl.cover || pl.coverUrl,
              createdBy: pl.createdBy || activeProfile?.id || 'p-1',
              visibility: pl.visibility || (pl.isPrivate ? 'private' : 'family'),
            });
          });
        }

        reloadLibrary();
        toast.success(
          `Biblioteca importada com sucesso! ${parsed.tracks.length} música(s) adicionada(s). 📥`
        );
      } catch (err) {
        toast.error('Falha ao importar o arquivo. Verifique se o JSON é válido.');
      }
    };

    reader.readAsText(file);
    if (jsonImportRef.current) jsonImportRef.current.value = '';
  };

  // PLAYBACK PREFERENCES HANDLERS
  const handleSetSourcePref = (mode: 'auto' | 'mp3' | 'youtube') => {
    setSourcePref(mode);
    storage.save('playback_source_preference', mode);
    toast.success(`Preferência de reprodução: ${mode === 'auto' ? 'Automático' : mode === 'mp3' ? 'Preferir MP3' : 'Preferir YouTube'}!`);
  };

  const handleSetQualityPref = (quality: 'high' | 'medium' | 'low') => {
    setQualityPref(quality);
    storage.save('playback_quality_preference', quality);
    toast.success(`Qualidade de áudio definida para: ${quality === 'high' ? 'Alta (320kbps)' : quality === 'medium' ? 'Média (192kbps)' : 'Baixa (128kbps)'}!`);
  };

  // Color options for visual themes
  const themeOptions: { mode: NeonThemeMode; name: string; hex: string }[] = [
    { mode: 'purple', name: 'Vapor Purple', hex: '#9d4edd' },
    { mode: 'blue', name: 'Cyber Ocean', hex: '#00b4d8' },
    { mode: 'cyan', name: 'Emerald Mint', hex: '#06d6a0' },
    { mode: 'pink', name: 'Fever Pink', hex: '#ff007f' },
  ];

  const baseThemeOptions: { style: BaseThemeStyle; name: string; icon: React.ReactNode; desc: string }[] = [
    { style: 'neon', name: 'Neon Flow', icon: <Zap className="w-4 h-4 text-brand-purple-light" />, desc: 'Atmosfera cyberpunk escura com brilhos vibrantes' },
    { style: 'dark', name: 'Modo Escuro', icon: <Moon className="w-4 h-4 text-blue-400" />, desc: 'Contraste suave e sóbrio para escuta noturna' },
    { style: 'light', name: 'Modo Claro', icon: <Sun className="w-4 h-4 text-amber-400" />, desc: 'Interface de alta visibilidade e clareza' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Configurações & Sistema"
        description="Gerencie a biblioteca local do IndexedDB, downloads offline, motor de reprodução, parâmetros de cache e temas visuais."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= COLUMN 1: BIBLIOTECA & CACHE & DOWNLOADS ================= */}
        <div className="flex flex-col gap-6">
          {/* 1. SEÇÃO BIBLIOTECA */}
          <SectionTitle title="Métricas da Biblioteca" subtitle="Storage & Stats" />

          <GlassCard className="flex flex-col gap-4" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <HardDrive className="w-5 h-5 text-brand-purple-light" />
              <div>
                <h4 className="text-sm font-bold text-white">Armazenamento Local</h4>
                <p className="text-2xs text-brand-text-muted">Estado do banco de áudio IndexedDB do seu navegador.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 border border-brand-border/40 p-3.5 rounded-2xl flex flex-col gap-1">
                <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Local de Armazenamento</span>
                <span className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Database className="w-3.5 h-3.5 text-brand-purple-light" /> IndexedDB / Storage
                </span>
              </div>

              <div className="bg-black/30 border border-brand-border/40 p-3.5 rounded-2xl flex flex-col gap-1">
                <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Espaço Utilizado</span>
                <span className="text-xs font-black text-emerald-400 mt-0.5">
                  {formatBytes(storageStats.usedBytes)}
                </span>
              </div>

              <div className="bg-black/30 border border-brand-border/40 p-3.5 rounded-2xl flex flex-col gap-1">
                <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Espaço Disponível</span>
                <span className="text-xs font-black text-white mt-0.5">
                  {formatBytes(Math.max(0, storageStats.quotaBytes - storageStats.usedBytes))}
                </span>
              </div>

              <div className="bg-black/30 border border-brand-border/40 p-3.5 rounded-2xl flex flex-col gap-1">
                <span className="text-3xs font-extrabold uppercase text-brand-text-muted">Quantidade de Músicas</span>
                <span className="text-xs font-black text-brand-cyan mt-0.5 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> {globalTracks.length} faixas
                </span>
              </div>
            </div>

            <div className="bg-brand-surface/60 border border-brand-border/60 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Tempo Total da Biblioteca</span>
              </div>
              <span className="text-xs font-black text-amber-300 font-mono">
                {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes} min`}
              </span>
            </div>
          </GlassCard>

          {/* 2. SEÇÃO CACHE */}
          <SectionTitle title="Manutenção de Cache" subtitle="Cache Engine" />

          <GlassCard className="flex flex-col gap-4" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <FolderSync className="w-5 h-5 text-brand-cyan" />
              <div>
                <h4 className="text-sm font-bold text-white">Controle de Cache em Memória</h4>
                <p className="text-2xs text-brand-text-muted">Otimize a execução e recupere memória do navegador.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Limpar Cache de URLs</span>
                  <span className="text-3xs text-brand-text-muted">Revoga os ObjectURLs mantidos em memória do navegador.</span>
                </div>
                <Button size="sm" variant="secondary" onClick={handleClearCache}>
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" /> Limpar Cache
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Reconstruir Cache</span>
                  <span className="text-3xs text-brand-text-muted">Recarrega e reindexa o mapeamento de áudios locais.</span>
                </div>
                <Button size="sm" variant="secondary" onClick={handleRebuildCache}>
                  <RefreshCw className="w-3.5 h-3.5 text-brand-cyan" /> Reconstruir
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Escanear Arquivos Órfãos</span>
                  <span className="text-3xs text-brand-text-muted">Identifica e remove dados no IndexedDB sem música correspondente.</span>
                </div>
                <Button size="sm" variant="secondary" onClick={handleScanOrphans} disabled={isScanning}>
                  <Search className="w-3.5 h-3.5 text-brand-purple-light" /> Escanear
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* 3. SEÇÃO DOWNLOADS & BACKUP */}
          <SectionTitle title="Downloads e Backup" subtitle="Offline & Export" />

          <GlassCard className="flex flex-col gap-4" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <FolderArchive className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Gestão de Conteúdo Offline</h4>
                <p className="text-2xs text-brand-text-muted">Gerencie arquivos MP3 salvos e escolha o provedor de conversão.</p>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="p-3.5 bg-black/40 border border-brand-border/60 rounded-2xl flex flex-col gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-cyan" /> Provedor de Conversão MP3
              </span>
              <select
                value={ProviderFactory.getActiveProviderType()}
                onChange={(e) => {
                  ProviderFactory.setActiveProvider(e.target.value as any);
                  toast.success('Provedor de download atualizado!');
                }}
                className="bg-black/60 text-xs font-bold text-white border border-brand-border/60 rounded-xl p-2.5 outline-none cursor-pointer"
              >
                {ProviderFactory.getAvailableProviders().map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-1 mt-1">
                <span className="text-3xs font-bold text-brand-text-muted uppercase">URL do Servidor REST (Opcional)</span>
                <input
                  type="text"
                  placeholder="https://seu-servidor-converter.com/api/convert"
                  defaultValue={ProviderFactory.getEndpointUrl()}
                  onBlur={(e) => {
                    ProviderFactory.setActiveProvider(ProviderFactory.getActiveProviderType(), e.target.value);
                    toast.success('URL do endpoint salva!');
                  }}
                  className="bg-black/60 text-2xs text-white border border-brand-border/40 rounded-xl p-2 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                type="file"
                ref={jsonImportRef}
                accept=".json"
                onChange={handleImportLibrary}
                className="hidden"
              />

              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Limpar Downloads Locais</span>
                  <span className="text-3xs text-brand-text-muted">Apaga os arquivos de áudio gravados no IndexedDB.</span>
                </div>
                <Button size="sm" variant="danger" onClick={handleClearDownloads}>
                  <Trash2 className="w-3.5 h-3.5" /> Limpar MP3
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Exportar Biblioteca (JSON)</span>
                  <span className="text-3xs text-brand-text-muted">Baixe um backup com todas as músicas e playlists.</span>
                </div>
                <Button size="sm" variant="glow" onClick={handleExportLibrary}>
                  <FileJson className="w-3.5 h-3.5" /> Exportar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/30 border border-brand-border/40 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Importar Biblioteca (JSON)</span>
                  <span className="text-3xs text-brand-text-muted">Restaure um arquivo de backup previamente exportado.</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => jsonImportRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 text-emerald-400" /> Importar
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* 4. SEÇÃO CENTRAL DE IMPORTADORES & TUTORIAL PASSO A PASSO */}
          <SectionTitle title="Central de Importação & Servidores de Áudio Real" subtitle="Import Tutorial & RapidAPI Engine" />

          <GlassCard className="flex flex-col gap-5" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Sparkles className="w-5 h-5 text-brand-purple-light" />
              <div>
                <h4 className="text-sm font-bold text-white">Métodos de Importação & Extração MP3 via RapidAPI</h4>
                <p className="text-2xs text-brand-text-muted">Aprenda a cadastrar músicas, puxar dados do YouTube e extrair áudio real em MP3.</p>
              </div>
            </div>

            {/* RapidAPI Engine Active Info Badge */}
            <div className="p-4 bg-brand-surface/80 border border-brand-purple/30 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-brand-purple-light">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">RapidAPI YouTube MP3 Downloader</span>
                  <span className="text-3xs text-brand-text-muted">Integração nativa de 2 passos com download direto e armazenamento IndexedDB local.</span>
                </div>
              </div>
              <span className="text-3xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-extrabold border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                <Check className="w-3 h-3" /> API Ativa
              </span>
            </div>

            {/* STEP BY STEP TUTORIALS */}
            <div className="flex flex-col gap-3">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-brand-purple-light">
                Passo a Passo das Opções de Importação
              </h5>

              {/* Method 1 */}
              <div className="p-4 bg-black/40 border border-brand-border/40 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-purple/30 text-brand-purple-light border border-brand-purple/50 flex items-center justify-center text-3xs font-extrabold">1</span>
                    Importação Direta de MP3 / Áudio do Dispositivo
                  </span>
                  <span className="text-3xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">100% Offline</span>
                </div>
                <ol className="text-2xs text-brand-text-muted flex flex-col gap-1.5 pl-6 list-decimal mt-1 leading-relaxed">
                  <li>Navegue até a página <strong>Biblioteca</strong> e clique em <strong>"Cadastrar Nova Música"</strong>.</li>
                  <li>Na aba <strong>"1. Informações Básicas"</strong>, selecione a opção <strong>"Upload Arquivo MP3"</strong>.</li>
                  <li>Escolha o arquivo <code>.mp3</code>, <code>.m4a</code> ou <code>.wav</code> salvo no seu computador ou celular.</li>
                  <li>O arquivo de áudio é salvo diretamente no banco local <strong>IndexedDB</strong> do seu navegador.</li>
                  <li>A música poderá ser executada e exportada offline em qualquer momento sem consumo de internet!</li>
                </ol>
              </div>

              {/* Method 2 */}
              <div className="p-4 bg-black/40 border border-brand-border/40 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/50 flex items-center justify-center text-3xs font-extrabold">2</span>
                    Importação via Link do YouTube (Metadados + Extração)
                  </span>
                  <span className="text-3xs bg-brand-purple/20 text-brand-purple-light px-2 py-0.5 rounded-full font-bold border border-brand-purple/30">Streaming / Automação</span>
                </div>
                <ol className="text-2xs text-brand-text-muted flex flex-col gap-1.5 pl-6 list-decimal mt-1 leading-relaxed">
                  <li>Cole qualquer link de vídeo do YouTube (ex: <code>https://www.youtube.com/watch?v=...</code>).</li>
                  <li>Clique no botão <strong>"Puxar Dados"</strong>. O NeonFlow usará o oEmbed para carregar automaticamente o <strong>Título</strong>, <strong>Artista/Canal</strong> e a <strong>Capa em Alta Definição</strong>.</li>
                  <li>Valide a prévia dos dados exibida e confirme o cadastro para ganhar <strong>+150 XP</strong>.</li>
                  <li>Para baixar o áudio real MP3 do vídeo, abra a modal da música e clique em <strong>"Salvar no Disco MP3"</strong> ou acesse a aba <strong>Downloads</strong>.</li>
                </ol>
              </div>

              {/* Method 3 */}
              <div className="p-4 bg-black/40 border border-brand-border/40 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center justify-center text-3xs font-extrabold">3</span>
                    Salvar no Disco / Exportar para Pasta do Dispositivo
                  </span>
                  <span className="text-3xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">File System API</span>
                </div>
                <ol className="text-2xs text-brand-text-muted flex flex-col gap-1.5 pl-6 list-decimal mt-1 leading-relaxed">
                  <li>Clique no botão <strong>"Salvar no Disco MP3"</strong> em qualquer modal de download.</li>
                  <li>O navegador abrirá a janela nativa do seu sistema operacional para escolher a pasta desejada (ex: <code>Músicas</code>, <code>Downloads</code> ou <code>public/assets/music</code>).</li>
                  <li>O arquivo <code>.mp3</code> é gravado no seu disco rígido e fica acessível por qualquer outro player de áudio.</li>
                </ol>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ================= COLUMN 2: REPRODUÇÃO & TEMA & ADMIN ================= */}
        <div className="flex flex-col gap-6">
          {/* 4. SEÇÃO REPRODUÇÃO */}
          <SectionTitle title="Motor de Reprodução" subtitle="Audio Engine" />

          <GlassCard className="flex flex-col gap-5" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Volume2 className="w-5 h-5 text-brand-purple-light" />
              <div>
                <h4 className="text-sm font-bold text-white">Preferências de Áudio</h4>
                <p className="text-2xs text-brand-text-muted">Configure a fonte padrão e a qualidade de transmissão.</p>
              </div>
            </div>

            {/* Fonte de Reprodução Preferida */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-brand-text-muted flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-purple-light" /> Fonte de Áudio Preferida
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetSourcePref('auto')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    sourcePref === 'auto'
                      ? 'bg-brand-purple/20 border-brand-purple text-white shadow-lg shadow-brand-purple/20'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-brand-cyan" />
                  <span className="text-2xs font-extrabold">Automático</span>
                </button>

                <button
                  onClick={() => handleSetSourcePref('mp3')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    sourcePref === 'mp3'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xs font-extrabold">Preferir MP3</span>
                </button>

                <button
                  onClick={() => handleSetSourcePref('youtube')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    sourcePref === 'youtube'
                      ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-500/20'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <Radio className="w-4 h-4 text-red-400" />
                  <span className="text-2xs font-extrabold">Preferir YouTube</span>
                </button>
              </div>
            </div>

            {/* Qualidade de Áudio */}
            <div className="flex flex-col gap-2 pt-2 border-t border-brand-border/40">
              <span className="text-xs font-bold text-brand-text-muted">Qualidade de Áudio</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetQualityPref('high')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    qualityPref === 'high'
                      ? 'bg-brand-purple/20 border-brand-purple text-white'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <span className="text-2xs font-black text-emerald-400">320 kbps</span>
                  <span className="text-3xs font-extrabold">Alta Qualidade</span>
                </button>

                <button
                  onClick={() => handleSetQualityPref('medium')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    qualityPref === 'medium'
                      ? 'bg-brand-purple/20 border-brand-purple text-white'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <span className="text-2xs font-black text-amber-400">192 kbps</span>
                  <span className="text-3xs font-extrabold">Média Qualidade</span>
                </button>

                <button
                  onClick={() => handleSetQualityPref('low')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    qualityPref === 'low'
                      ? 'bg-brand-purple/20 border-brand-purple text-white'
                      : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <span className="text-2xs font-black text-brand-cyan">128 kbps</span>
                  <span className="text-3xs font-extrabold">Baixa (Economia)</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* 5. SEÇÃO TEMA */}
          <SectionTitle title="Aparência e Estilo Visual" subtitle="Theme Customization" />

          <GlassCard className="flex flex-col gap-5" hoverable={false}>
            <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
              <Palette className="w-5 h-5 text-brand-purple-light" style={{ color: activeProfile?.color }} />
              <div>
                <h4 className="text-sm font-bold text-white">Modo e Tom Visual</h4>
                <p className="text-2xs text-brand-text-muted">Escolha a atmosfera da interface do Neon Flow.</p>
              </div>
            </div>

            {/* Estilo Base: Neon / Escuro / Claro */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-brand-text-muted">Estilo de Interface</span>
              <div className="grid grid-cols-3 gap-2">
                {baseThemeOptions.map((opt) => (
                  <button
                    key={opt.style}
                    onClick={() => {
                      setThemeStyle(opt.style);
                      toast.success(`Estilo de interface: ${opt.name}!`);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                      themeStyle === opt.style
                        ? 'bg-brand-purple/20 border-brand-purple text-white shadow-md'
                        : 'bg-black/30 border-brand-border/60 text-brand-text-muted hover:text-white'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-2xs font-extrabold">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Mode (Tom Neon) */}
            <div className="flex flex-col gap-2 pt-3 border-t border-brand-border/40">
              <span className="text-xs font-bold text-brand-text-muted">Tom de Destaque Neon</span>
              <div className="grid grid-cols-2 gap-3">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      setThemeMode(opt.mode);
                      toast.success(`Tom de destaque alterado para: ${opt.name}!`);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      activeTheme === opt.mode
                        ? 'bg-white/5 border-white text-white'
                        : 'bg-transparent border-brand-border/60 text-brand-text-muted hover:text-white hover:border-brand-border'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.hex }} />
                      <span className="text-xs font-bold">{opt.name}</span>
                    </div>
                    {activeTheme === opt.mode && <Check className="w-4 h-4 text-brand-cyan" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Ambient Glow */}
            <div className="flex items-center justify-between p-3.5 bg-brand-surface border border-brand-border rounded-xl mt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-brand-text">Efeitos de Brilho (Glows)</span>
                <span className="text-3xs text-brand-text-muted">Aplica brilho neon em botões e cards ativos.</span>
              </div>
              <button
                onClick={toggleGlow}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                  glowEnabled ? themeColors.primaryBg : 'bg-brand-card'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    glowEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </GlassCard>

          {/* ADMINISTRACAO FAMILIAR & MANUTENÇÃO */}
          <SectionTitle title="Administração Familiar" subtitle="Family Group" />

          <GlassCard className="flex flex-col gap-5" hoverable={false}>
            <form onSubmit={handleSaveFamilyName} className="flex flex-col gap-4">
              <Input
                label="Nome do Grupo Familiar"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                required
                icon={<Settings className="w-4.5 h-4.5 text-brand-text-muted" />}
              />
              <Button type="submit" variant="primary" size="sm" className="self-end">
                <Save className="w-4 h-4" /> Salvar Nome
              </Button>
            </form>

            <div className="flex flex-col gap-3.5 border-t border-brand-border/40 pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">Chave de Compartilhamento</span>
                <span className="text-2xs text-brand-text-muted">Envie esta chave aos seus familiares para sincronizar bibliotecas.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-brand-surface p-3 border border-brand-border rounded-xl font-mono text-sm font-black text-white text-center">
                  {family.inviteCode}
                </div>
                <Button onClick={handleRegenInvite} variant="secondary" size="md">
                  <RefreshCw className="w-4 h-4" /> Nova Chave
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Reset Banco Local */}
          <div className="p-5 rounded-3xl bg-red-950/20 border border-red-500/20 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-extrabold">Redefinição e Limpeza do Sistema</h4>
            </div>
            <p className="text-2xs text-brand-text-muted leading-relaxed font-semibold">
              Restaura o estado do aplicativo. Use a opção de Hard Reset para apagar completamente todas as chaves do LocalStorage e IndexedDB, garantindo um início 100% limpo e zerado.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={handleReset} variant="secondary" size="sm">
                Redefinir Sessões e Estado
              </Button>
              <Button onClick={handleHardReset} variant="danger" size="sm">
                <Trash2 className="w-4 h-4" /> Resetar Banco de Dados Local (Hard Reset)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
