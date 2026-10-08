import { usePlayer as usePlayerContext } from '../contexts/PlayerContext';

export function usePlayer() {
  return usePlayerContext();
}
