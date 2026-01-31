'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CoverImage } from '@/components/CoverImage';
import { useLoadImage } from '@/hooks/useLoadImage';
import { useLidarrConfigured } from '@/hooks/useLidarrConfigured';
import { usePlayer } from '@/hooks/usePlayer';
import type { Track } from '@/types';
import { isSupabaseTrack, isSpotifyTrack, NAVIDROME_ID_PREFIX, SPOTIFY_ID_PREFIX } from '@/types';
import { QueueActionsMenu, type RequestDownloadTrack } from './QueueActionsMenu';

interface MediaItemProps {
  data: Track;
  onClick?: (id: string) => void;
  onAddToQueue?: () => void;
  onPlayNext?: () => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  data,
  onClick,
  onAddToQueue,
  onPlayNext,
}) => {
  const player = usePlayer();
  const imageUrl = useLoadImage(data);
  const lidarrConfigured = useLidarrConfigured();
  const author = isSupabaseTrack(data) ? data.author : (data.artist ?? '');
  const playId = isSupabaseTrack(data) ? data.id : isSpotifyTrack(data) ? SPOTIFY_ID_PREFIX + data.id : NAVIDROME_ID_PREFIX + data.id;
  const [requesting, setRequesting] = useState(false);

  const handleClick = () => {
    if (onClick) {
      return onClick(playId);
    }
    return player.setId(playId);
  };

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

  const showQueueMenu = onAddToQueue != null && onPlayNext != null;
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
            flex-1
            flex-col
            gap-y-1
            overflow-hidden
            min-w-0
            "
      >
        <p className="text-white truncate">{data.title}</p>
        <p className="text-neutral-400 text-sm truncate">{author}</p>
      </div>
      {showQueueMenu && (
        <div onClick={(e) => e.stopPropagation()}>
          <QueueActionsMenu
            onAddToQueue={onAddToQueue}
            onPlayNext={onPlayNext}
            lidarrConfigured={lidarrConfigured === true}
            track={requestDownloadTrack}
            onRequestDownload={onRequestDownload}
          />
        </div>
      )}
    </div>
  );
};
