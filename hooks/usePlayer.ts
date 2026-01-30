import { create } from 'zustand';

export type RepeatMode = 'off' | 'all' | 'one';

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface PlayerStore {
  ids: string[];
  shuffledIds: string[] | null;
  activeId?: string;
  shuffle: boolean;
  repeat: RepeatMode;
  setId: (id: string) => void;
  setIds: (ids: string[]) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: RepeatMode) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  reset: () => void;
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  ids: [],
  shuffledIds: null,
  activeId: undefined,
  shuffle: false,
  repeat: 'off',
  setId: (id: string) => set({ activeId: id }),
  setIds: (ids: string[]) => {
    const state = get();
    const shuffledIds = state.shuffle ? shuffleArray(ids) : null;
    set({ ids, shuffledIds });
  },
  setShuffle: (shuffle: boolean) => {
    const state = get();
    const shuffledIds = shuffle ? shuffleArray(state.ids) : null;
    set({ shuffle, shuffledIds });
  },
  setRepeat: (repeat: RepeatMode) => set({ repeat }),
  toggleShuffle: () => {
    const state = get();
    const shuffle = !state.shuffle;
    const shuffledIds = shuffle ? shuffleArray(state.ids) : null;
    set({ shuffle, shuffledIds });
  },
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),
  reset: () =>
    set({ ids: [], shuffledIds: null, activeId: undefined, shuffle: false, repeat: 'off' }),
}));
