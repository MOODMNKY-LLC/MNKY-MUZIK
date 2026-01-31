'use client';

import type { Track } from '@/types';
import { MediaItem } from '@/components/MediaItem';
import { LikeButton } from '@/components/LikeButton';
import { useOnPlay } from '@/hooks/useOnPlay';
import { useQueueActions } from '@/hooks/useQueueActions';

interface HomeLikedSectionProps {
  tracks: Track[];
  title: string;
}

export function HomeLikedSection({ tracks, title }: HomeLikedSectionProps) {
  const onPlay = useOnPlay(tracks);
  const { addTrackToQueue, playTrackNext } = useQueueActions(tracks);

  if (tracks.length === 0) return null;

  return (
    <section>
      <h2 className="text-white text-2xl font-semibold mb-4">{title}</h2>
      <div className="flex flex-col gap-y-2">
        {tracks.map((track) => (
          <div key={track.id + (track.source ?? '')} className="flex items-center gap-x-4 w-full">
            <div className="flex-1 min-w-0">
              <MediaItem
                onClick={(id: string) => onPlay(id)}
                data={track}
                onAddToQueue={() => addTrackToQueue(track)}
                onPlayNext={() => playTrackNext(track)}
              />
            </div>
            <LikeButton track={track} />
          </div>
        ))}
      </div>
    </section>
  );
}
