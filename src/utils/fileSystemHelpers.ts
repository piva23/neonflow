import { toast } from 'react-hot-toast';

/**
 * Request storage persistence from the browser/PWA so IndexedDB media blobs are preserved.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        if (granted) {
          console.log('[Storage] Permissão de armazenamento persistente concedida!');
        }
        return granted;
      }
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Erro ao solicitar armazenamento persistente:', e);
    }
  }
  return false;
}

/**
 * Save a Blob file directly to the local disk/computer.
 * Uses File System Access API (showSaveFilePicker) when supported (Desktop Chrome/Edge/Opera/PWA),
 * and falls back to standard download link element.
 */
export async function saveFileToDisk(blob: Blob, suggestedFileName: string): Promise<boolean> {
  const cleanName = suggestedFileName.replace(/[/\\?%*:|"<>]/g, '_');

  // Try File System Access API
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: cleanName.endsWith('.mp3') ? cleanName : `${cleanName}.mp3`,
        types: [
          {
            description: 'Arquivo de Áudio MP3',
            accept: { 'audio/mpeg': ['.mp3', '.m4a', '.wav'] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      toast.success(`Arquivo salvo com sucesso em: ${handle.name}`, { icon: '💾' });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled picker, do nothing
        return false;
      }
      console.warn('[Storage] Fallback para download padrão via link:', err);
    }
  }

  // Fallback: standard HTML5 anchor download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName.endsWith('.mp3') ? cleanName : `${cleanName}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    toast.success(`Download do arquivo ${cleanName} iniciado!`, { icon: '⬇️' });
    return true;
  } catch (err) {
    console.error('[Storage] Erro no download do arquivo:', err);
    toast.error('Erro ao salvar arquivo no dispositivo');
    return false;
  }
}
