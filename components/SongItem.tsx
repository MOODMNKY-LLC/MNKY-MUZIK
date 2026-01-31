'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { Track } from '@/types';
import { isSupabaseTrack, NAVIDROME_ID_PREFIX } from '@/types';
import { useLidarrConfigured } from '@/hooks/useLidarrConfigured';
import { PlayButton } from './PlayButton';
import { QueueActionsMenu, type RequestDownloadTrack } from './QueueActionsMenu';
import { CoverImage } from '@/components/CoverImage';
import { useLoadImage } from '@/hooks/useLoadImage';

interface SongItemProps {
  data: Track;
  onClick: (id: string) => void;
  onAddToQueue?: () => void;
  onPlayNext?: () => void;
}

export const SongItem: React.FC<SongItemProps> = ({
  data,
  onClick,
  onAddToQueue,
  onPlayNext,
}) => {
  const imagePath = useLoadImage(data);
  const lidarrConfigured = useLidarrConfigured();
  const playId = isSupabaseTrack(data) ? data.id : NAVIDROME_ID_PREFIX + data.id;
  const author = isSupabaseTrack(data) ? data.author : (data.artist ?? '');
  const [requesting, setRequesting] = useState(false);

  const requestDownloadTrack: RequestDownloadTrack = {
    title: data.title,
    artist: author || undefined,
    album: !isSupabaseTrack(data) && 'album' in data ? data.album : undefined,
  };

  const onRequestDownload = async (track: RequestDownloadTrack) => {
    if (requesting) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/lidarr/request-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? 'Request failed');
        return;
      }
      toast.success(body.message ?? 'Added to download queue.');
    } catch {
      toast.error('Request failed');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      onClick={() => onClick(playId)}
      className="
        relative 
        group
        flex 
        flex-col
        items-center
        justify-center
        overflow-hidden
        gap-x-4
        bg-neutral-400/5
        cursor-pointer
        hover:bg-neutral-400/10
        transition
        p-3
        "
    >
      <div
        className="
            relative 
            aspect-square
            w-full
            h-full
            rounded-md
            overflow-hidden
            "
      >
        <CoverImage
          loading="eager"
          className="object-cover"
          src={imagePath || '/images/liked.png'}
          fill
          alt="Image"
        />
      </div>
      <div className="flex flex-col items-start w-full pt-4 gap-y-1">
        <p className="font-semibold truncate w-full">{data.title}</p>
        <p className="text-neutral-400 text-sm pb-4 w-full truncate">By {author}</p>
      </div>
      <div className="absolute bottom-24 right-5 flex items-center gap-x-2">
        {onAddToQueue != null && onPlayNext != null && (
          <div
            className="opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <QueueActionsMenu
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
              lidarrConfigured={lidarrConfigured === true}
              track={requestDownloadTrack}
              onRequestDownload={onRequestDownload}
            />
          </div>
        )}
        <PlayButton />
      </div>
    </div>
  );
};
