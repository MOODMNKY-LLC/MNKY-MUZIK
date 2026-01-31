import type { Track } from '@/types';
import { isSupabaseTrack, NAVIDROME_ID_PREFIX } from '@/types';
import { usePlayer } from './usePlayer';
import { useAuthModal } from './useAuthModal';
import { useUser } from './useUser';
import { useSubscribeModal } from './useSubscribeModal';

function getPlayId(track: Track): string {
  return isSupabaseTrack(track) ? track.id : NAVIDROME_ID_PREFIX + track.id;
}

export function useQueueActions(tracks: Track[]) {
  const player = usePlayer();
  const authModal = useAuthModal();
  const subscribeModal = useSubscribeModal();
  const { user, canPlay } = useUser();

  const addToQueue = (id: string) => {
    if (!user) return authModal.onOpen();
    if (!canPlay) return subscribeModal.onOpen();
    player.addToQueue([id]);
  };

  const playNext = (id: string) => {
    if (!user) return authModal.onOpen();
    if (!canPlay) return subscribeModal.onOpen();
    player.playNext([id]);
  };

  const addTrackToQueue = (track: Track) => addToQueue(getPlayId(track));
  const playTrackNext = (track: Track) => playNext(getPlayId(track));

  const addAllToQueue = () => {
    if (!user) return authModal.onOpen();
    if (!canPlay) return subscribeModal.onOpen();
    const ids = tracks.map((t) => getPlayId(t));
    player.addToQueue(ids);
  };

  return { addToQueue, playNext, addTrackToQueue, playTrackNext, addAllToQueue, getPlayId };
}
