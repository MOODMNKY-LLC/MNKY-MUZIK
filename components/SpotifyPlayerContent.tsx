'use client';

import { useEffect } from 'react';
import type { SpotifyTrack } from '@/types';
import { usePlayer } from '@/hooks/usePlayer';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { MdQueueMusic, MdFullscreen } from 'react-icons/md';
import { MediaItem } from './MediaItem';

interface SpotifyPlayerContentProps {
  track: SpotifyTrack;
}

export function SpotifyPlayerContent({ track }: SpotifyPlayerContentProps) {
  const player = usePlayer();
  const { isReady, error, play } = useSpotifyPlayer(true);

  const uri = track.uri ?? `spotify:track:${track.id}`;

  useEffect(() => {
    if (isReady && uri) {
      play([uri]).catch(() => {});
    }
  }, [isReady, uri, play]);

  const order = player.shuffle && player.shuffledIds?.length ? player.shuffledIds : player.ids;

  const onPlayNext = () => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= order.length) {
      if (player.repeat === 'all') player.setId(order[0]);
      return;
    }
    player.setId(order[nextIndex]);
  };

  const onPlayPrevious = () => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (player.repeat === 'all') player.setId(order[order.length - 1]);
      return;
    }
    player.setId(order[prevIndex]);
  };

  if (error) {
    return (
      <div className="flex items-center justify-between w-full py-2 px-4">
        <div className="flex items-center gap-x-4 min-w-0">
          <MediaItem data={track} onClick={() => {}} />
        </div>
        <p className="text-amber-400 text-sm truncate">Spotify Premium required</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-between w-full py-2 px-4">
        <div className="flex items-center gap-x-4 min-w-0">
          <MediaItem data={track} onClick={() => {}} />
        </div>
        <p className="text-neutral-400 text-sm">Connecting to Spotify…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-2 px-4">
      <div className="flex items-center gap-x-4 min-w-0 flex-1">
        <MediaItem data={track} onClick={() => {}} />
      </div>
      <div className="flex items-center gap-x-4">
        <button onClick={onPlayPrevious} className="text-white hover:text-white/80 transition">
          <AiFillBackward size={28} />
        </button>
        <button className="text-white rounded-full p-2 flex items-center justify-center bg-white/10 hover:bg-white/20 transition">
          <BsPlayFill size={24} className="text-black" />
        </button>
        <button onClick={onPlayNext} className="text-white hover:text-white/80 transition">
          <AiFillStepForward size={28} />
        </button>
        <button onClick={() => player.setQueueOpen(true)} className="text-white hover:text-white/80 transition">
          <MdQueueMusic size={24} />
        </button>
        <button onClick={() => player.setExpanded(true)} className="text-white hover:text-white/80 transition">
          <MdFullscreen size={20} />
        </button>
      </div>
    </div>
  );
}
