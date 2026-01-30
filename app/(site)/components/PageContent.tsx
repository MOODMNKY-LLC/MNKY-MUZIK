'use client';

import { SongItem } from '@/components/SongItem';
import { useOnPlay } from '@/hooks/useOnPlay';
import type { Song, SupabaseTrack } from '@/types';

interface PageContentProps {
  songs: Song[];
}

export const PageContent: React.FC<PageContentProps> = ({ songs }) => {
  const tracks: SupabaseTrack[] = songs.map((s) => ({ ...s, source: 'supabase' }));
  const onPlay = useOnPlay(tracks);

  if (tracks.length === 0) {
    return <div className="mt-4 text-neutral-400">No songs available</div>;
  }

  return (
    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
        2xl:grid-cols-8
        gap-4
        mt-4
        "
    >
      {tracks.map((item) => (
        <SongItem key={item.id} onClick={(id: string) => onPlay(id)} data={item} />
      ))}
    </div>
  );
};
