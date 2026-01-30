'use client';

import { useGetTrackById } from '@/hooks/useGetTrackById';
import { useLoadTrackUrl } from '@/hooks/useLoadTrackUrl';
import { usePlayer } from '@/hooks/usePlayer';

import { PlayerContent } from './PlayerContent';

export const Player = () => {
  const player = usePlayer();
  const { track } = useGetTrackById(player.activeId);
  const songUrl = useLoadTrackUrl(track);

  if (!track || !songUrl || !player.activeId) {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        bg-black
        w-full
        py-2
        px-4
        min-h-[80px]
        pb-[env(safe-area-inset-bottom,0px)]
        "
    >
      <PlayerContent key={songUrl} track={track} songUrl={songUrl} />
    </div>
  );
};
