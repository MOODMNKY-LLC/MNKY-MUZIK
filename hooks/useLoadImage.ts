import type { Track } from '@/types';
import { useSupabaseClient } from '@/providers/SupabaseProvider';
import { isSupabaseTrack, isSpotifyTrack } from '@/types';

/**
 * Returns image URL for a track (Supabase images bucket, Navidrome cover proxy, or Spotify URL).
 */
export function useLoadImage(track: Track | null | undefined): string | null {
  const supabaseClient = useSupabaseClient();

  if (!track) return null;

  if (isSupabaseTrack(track)) {
    const { data } = supabaseClient.storage.from('images').getPublicUrl(track.image_path);
    return data.publicUrl;
  }

  if (isSpotifyTrack(track) && track.coverArt) {
    return track.coverArt;
  }

  if (!track.coverArt) return null;
  return `/api/navidrome/cover?id=${encodeURIComponent(track.coverArt)}`;
}
