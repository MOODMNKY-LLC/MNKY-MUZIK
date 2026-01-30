import type { Track } from '@/types';
import { useSupabaseClient } from '@/providers/SupabaseProvider';
import { isSupabaseTrack } from '@/types';

/**
 * Returns playable URL for a track (Supabase storage or Navidrome stream proxy).
 */
export function useLoadTrackUrl(track: Track | null | undefined): string {
  const supabaseClient = useSupabaseClient();

  if (!track) return '';

  if (isSupabaseTrack(track)) {
    const { data } = supabaseClient.storage.from('songs').getPublicUrl(track.song_path);
    return data.publicUrl;
  }

  return `/api/navidrome/stream?id=${encodeURIComponent(track.id)}`;
}
