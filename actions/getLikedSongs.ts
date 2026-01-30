import { Song } from '@/types';
import { createClient } from '@/lib/supabase/server';

export const getLikedSongs = async (): Promise<Song[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('liked_songs')
    .select('*, songs(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.log(error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((item: { songs: Song }) => ({
    ...item.songs,
  }));
};
