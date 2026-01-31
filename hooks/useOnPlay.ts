import type { Track } from '@/types';
import { isSupabaseTrack, isSpotifyTrack, NAVIDROME_ID_PREFIX, SPOTIFY_ID_PREFIX } from '@/types';
import { usePlayer } from './usePlayer';
import { useAuthModal } from './useAuthModal';
import { useUser } from './useUser';
import { useSubscribeModal } from './useSubscribeModal';

export function useOnPlay(tracks: Track[]) {
  const subscribeModal = useSubscribeModal();
  const player = usePlayer();
  const authModal = useAuthModal();
  const { user, canPlay } = useUser();

  const playIds = tracks.map((t) => {
    if (isSpotifyTrack(t)) return SPOTIFY_ID_PREFIX + t.id;
    if (isSupabaseTrack(t)) return t.id;
    return NAVIDROME_ID_PREFIX + t.id;
  });

  const onPlay = (id: string) => {
    if (!user) return authModal.onOpen();
    if (!canPlay) return subscribeModal.onOpen();
    player.setId(id);
    player.setIds(playIds);
  };
  return onPlay;
}
