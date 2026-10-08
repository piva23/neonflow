import { usePlayer } from '../contexts/PlayerContext';

export function useQueue() {
  const {
    queue,
    addToQueue,
    addNextToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    setQueue,
    shuffleMode,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  return {
    queue,
    addToQueue,
    addNextToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    setQueue,
    shuffleMode,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  };
}
