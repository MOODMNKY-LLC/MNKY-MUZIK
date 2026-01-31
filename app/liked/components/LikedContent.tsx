'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { Track } from '@/types';
import { isSupabaseTrack, NAVIDROME_ID_PREFIX } from '@/types';
import { useUser } from '@/hooks/useUser';
import { MediaItem } from '@/components/MediaItem';
import { LikeButton } from '@/components/LikeButton';
import { useOnPlay } from '@/hooks/useOnPlay';
import { useQueueActions } from '@/hooks/useQueueActions';

interface LikedContentProps {
  tracks: Track[];
}

export const LikedContent: React.FC<LikedContentProps> = ({ tracks }) => {
  const router = useRouter();
  const { isLoading, user } = useUser();
  const onPlay = useOnPlay(tracks);
  const { addTrackToQueue, playTrackNext } = useQueueActions(tracks);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-y-4 w-full px-4 sm:px-6 py-8 text-neutral-400">
        <Image
          src="/images/mnky-muzik-app-icon.png"
          alt=""
          width={48}
          height={48}
          className="object-contain opacity-80"
        />
        <p>No liked songs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2 w-full p-4 sm:p-6">
      {tracks.map((track) => {
        const key = isSupabaseTrack(track) ? track.id : NAVIDROME_ID_PREFIX + track.id;
        return (
          <div key={key} className="flex items-center gap-x-4 w-full">
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
        );
      })}
    </div>
  );
};
