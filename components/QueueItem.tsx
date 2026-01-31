'use client';

import { useGetTrackById } from '@/hooks/useGetTrackById';
import { useLoadImage } from '@/hooks/useLoadImage';
import { usePlayer } from '@/hooks/usePlayer';
import { CoverImage } from '@/components/CoverImage';
import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';
import { MdClose } from 'react-icons/md';

interface QueueItemProps {
  id: string;
  isActive?: boolean;
  onRemove: (id: string) => void;
}

export function QueueItem({ id, isActive, onRemove }: QueueItemProps) {
  const player = usePlayer();
  const { track } = useGetTrackById(id);
  const imageUrl = useLoadImage(track ?? null);
  const author = track
    ? isSupabaseTrack(track)
      ? track.author
      : track.artist ?? ''
    : '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    player.setId(id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(id);
  };

  if (!track) {
    return (
      <div className="flex items-center gap-x-3 p-2 rounded-md animate-pulse">
        <div className="min-w-[40px] min-h-[40px] rounded bg-neutral-700" />
        <div className="flex-1 h-4 bg-neutral-700 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-x-3 w-full p-2 rounded-md cursor-pointer transition
        hover:bg-neutral-800/50
        ${isActive ? 'bg-neutral-800/70' : ''}
      `}
    >
      <div className="relative min-w-[40px] min-h-[40px] rounded overflow-hidden shrink-0">
        <CoverImage
          fill
          src={imageUrl || '/images/liked.png'}
          alt={(track as Track).title}
          className="object-cover"
          sizes="40px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm ${isActive ? 'text-green-400 font-medium' : 'text-white'}`}>
          {(track as Track).title}
        </p>
        <p className="text-neutral-400 text-xs truncate">{author}</p>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition shrink-0"
        aria-label="Remove from queue"
      >
        <MdClose size={18} />
      </button>
    </div>
  );
}
