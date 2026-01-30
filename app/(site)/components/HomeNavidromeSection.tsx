'use client';

import type { NavidromeTrack } from '@/types';
import { TrackRow } from '@/components/TrackRow';

interface HomeNavidromeSectionProps {
  tracks: NavidromeTrack[];
  title: string;
}

export function HomeNavidromeSection({ tracks, title }: HomeNavidromeSectionProps) {
  if (tracks.length === 0) return null;

  return (
    <section>
      <h2 className="text-white text-2xl font-semibold mb-4">{title}</h2>
      <div className="flex flex-col gap-y-2">
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} tracks={tracks} />
        ))}
      </div>
    </section>
  );
}
