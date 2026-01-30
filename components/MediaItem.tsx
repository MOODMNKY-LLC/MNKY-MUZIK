'use client';

import { CoverImage } from '@/components/CoverImage';
import { useLoadImage } from '@/hooks/useLoadImage';

import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';
import { NAVIDROME_ID_PREFIX } from '@/types';

import { usePlayer } from '@/hooks/usePlayer';

interface MediaItemProps {
  data: Track;
  onClick?: (id: string) => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({ data, onClick }) => {
  const player = usePlayer();
  const imageUrl = useLoadImage(data);
  const author = isSupabaseTrack(data) ? data.author : (data.artist ?? '');
  const playId = isSupabaseTrack(data) ? data.id : NAVIDROME_ID_PREFIX + data.id;
  const handleClick = () => {
    if (onClick) {
      return onClick(playId);
    }
    return player.setId(playId);
  };
  return (
    <div
      onClick={handleClick}
      className="
        flex
        items-center
        gap-x-3
        cursor-pointer
        hover:bg-neutral-800/50
        w-full
        p-2
        rounded-md
        "
    >
      <div
        className="
            relative
            rounded-md 
            min-h-[48px]
            min-w-[48px]
            overflow-hidden
            "
      >
        <CoverImage
          fill
          src={imageUrl || '/images/liked.png'}
          alt="Media Item"
          className="object-cover"
        />
      </div>
      <div
        className="
            flex
            flex-col
            gap-y-1
            overflow-hidden
            "
      >
        <p className="text-white truncate">{data.title}</p>
        <p className="text-neutral-400 text-sm truncate">{author}</p>
      </div>
    </div>
  );
};
