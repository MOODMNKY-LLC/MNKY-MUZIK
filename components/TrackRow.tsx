'use client';

import type { Track } from '@/types';
import { NAVIDROME_ID_PREFIX, SPOTIFY_ID_PREFIX, isSpotifyTrack, isSupabaseTrack } from '@/types';
import { useOnPlay } from '@/hooks/useOnPlay';
import { useLoadImage } from '@/hooks/useLoadImage';
import { CoverImage } from '@/components/CoverImage';
import { LikeButton } from './LikeButton';
import { PlayButton } from './PlayButton';
import { QueueActionsMenu } from './QueueActionsMenu';

interface TrackRowProps {
  track: Track;
  tracks: Track[];
  onAddToQueue?: () => void;
  onPlayNext?: () => void;
}

export function TrackRow({
  track,
  tracks,
  onAddToQueue,
  onPlayNext,
}: TrackRowProps) {
  const onPlay = useOnPlay(tracks);
  const imageUrl = useLoadImage(track);
  const playId = isSpotifyTrack(track) ? SPOTIFY_ID_PREFIX + track.id : NAVIDROME_ID_PREFIX + track.id;

  return (
    <div
      onClick={() => onPlay(playId)}
      className="
        group
        flex
        items-center
        gap-x-4
        w-full
        p-2
        rounded-md
        hover:bg-neutral-800/50
        cursor-pointer
        transition
      "
    >
      <div className="relative min-w-[48px] min-h-[48px] rounded overflow-hidden">
        <CoverImage
          fill
          src={imageUrl || '/images/liked.png'}
          alt={track.title}
          className="object-cover"
          sizes="48px"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <PlayButton />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white truncate">{track.title}</p>
        <p className="text-neutral-400 text-sm truncate">{isSupabaseTrack(track) ? track.author : (track.artist ?? 'Unknown')}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-x-1" onClick={(e) => e.stopPropagation()}>
        {onAddToQueue != null && onPlayNext != null && (
          <QueueActionsMenu onAddToQueue={onAddToQueue} onPlayNext={onPlayNext} />
        )}
        <LikeButton track={track} />
      </div>
    </div>
  );
}
