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
  /** Append ids to the end of the queue */
  addToQueue: (ids: string[]) => void;
  /** Insert ids immediately after the currently playing track */
  playNext: (ids: string[]) => void;
  /** Remove a single id from the queue */
  removeFromQueue: (id: string) => void;
  /** Order for display/playback (respects shuffle) */
  queueOrder: () => string[];
  isQueueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  isExpanded: boolean;
  setExpanded: (open: boolean) => void;
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
  addToQueue: (ids: string[]) => {
    const state = get();
    if (ids.length === 0) return;
    const newIds = [...state.ids, ...ids];
    const newShuffled = state.shuffledIds
      ? [...state.shuffledIds, ...ids]
      : null;
    set({ ids: newIds, shuffledIds: newShuffled });
  },
  playNext: (ids: string[]) => {
    const state = get();
    if (ids.length === 0) return;
    const order =
      state.shuffle && state.shuffledIds?.length
        ? state.shuffledIds
        : state.ids;
    const currentIndex = state.activeId
      ? order.indexOf(state.activeId)
      : -1;
    const insertAt = currentIndex < 0 ? 0 : currentIndex + 1;
    const newOrder = [...order];
    newOrder.splice(insertAt, 0, ...ids);
    if (state.shuffle) {
      set({ shuffledIds: newOrder, ids: [...state.ids, ...ids] });
    } else {
      set({ ids: newOrder });
    }
  },
  removeFromQueue: (id: string) => {
    const state = get();
    const newIds = state.ids.filter((i) => i !== id);
    const newShuffled = state.shuffledIds
      ? state.shuffledIds.filter((i) => i !== id)
      : null;
    set({ ids: newIds, shuffledIds: newShuffled });
  },
  queueOrder: () => {
    const state = get();
    return state.shuffle && state.shuffledIds?.length
      ? state.shuffledIds
      : state.ids;
  },
  isQueueOpen: false,
  setQueueOpen: (open: boolean) => set({ isQueueOpen: open }),
  isExpanded: false,
  setExpanded: (open: boolean) => set({ isExpanded: open }),
}));
