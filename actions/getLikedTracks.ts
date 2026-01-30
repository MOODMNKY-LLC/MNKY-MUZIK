'use server';

import { getLikedSongs } from '@/actions/getLikedSongs';
import { getLikedNavidromeTracks } from '@/actions/getLikedNavidromeTracks';
import type { Track, SupabaseTrack } from '@/types';

/**
 * Returns merged liked tracks: Supabase liked_songs (as SupabaseTrack) + liked Navidrome tracks.
 */
export async function getLikedTracks(): Promise<Track[]> {
  const [supabaseSongs, navidromeTracks] = await Promise.all([
    getLikedSongs(),
    getLikedNavidromeTracks(),
  ]);
  const supabaseTracks: SupabaseTrack[] = supabaseSongs.map((s) => ({ ...s, source: 'supabase' }));
  return [...supabaseTracks, ...navidromeTracks];
}
