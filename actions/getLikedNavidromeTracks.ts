'use server';

import { createClient } from '@/lib/supabase/server';
import { getSong } from '@/libs/navidrome';
import type { NavidromeTrack } from '@/types';

function normalizeSong(song: Record<string, unknown>): NavidromeTrack {
  const id = String(song.id ?? '');
  return {
    id,
    source: 'navidrome',
    title: String(song.title ?? ''),
    artist: song.artist != null ? String(song.artist) : undefined,
    album: song.album != null ? String(song.album) : undefined,
    coverArt: song.coverArt != null ? String(song.coverArt) : undefined,
    duration: typeof song.duration === 'number' ? song.duration : undefined,
    contentType: song.contentType != null ? String(song.contentType) : undefined,
  };
}

export async function getLikedNavidromeTracks(): Promise<NavidromeTrack[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return [];

  const { data: rows, error } = await supabase
    .from('liked_navidrome_tracks')
    .select('navidrome_track_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !rows?.length) return [];

  const tracks: NavidromeTrack[] = [];
  for (const row of rows) {
    const id = row.navidrome_track_id as string;
    const data = await getSong(id);
    const song = data?.song as Record<string, unknown> | undefined;
    if (song) tracks.push(normalizeSong(song));
  }
  return tracks;
}
