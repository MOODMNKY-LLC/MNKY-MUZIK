'use server';

import { createClient } from '@/lib/supabase/server';

export async function toggleLikedNavidromeTrack(navidromeTrackId: string): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: 'Not authenticated' };
  }

  const { data: existing } = await supabase
    .from('liked_navidrome_tracks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('navidrome_track_id', navidromeTrackId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('liked_navidrome_tracks')
      .delete()
      .eq('user_id', user.id)
      .eq('navidrome_track_id', navidromeTrackId);
    if (error) return { error: error.message };
    return { liked: false };
  }

  const { error } = await supabase.from('liked_navidrome_tracks').insert({
    user_id: user.id,
    navidrome_track_id: navidromeTrackId,
  });
  if (error) return { error: error.message };
  return { liked: true };
}
