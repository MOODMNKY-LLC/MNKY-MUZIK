'use client';

import { useEffect, useState } from 'react';
import { useUser } from './useUser';

export interface SpotifyProfile {
  display_name: string | null;
  image: string | null;
  id: string;
}

export function useSpotifyProfile(): SpotifyProfile | null {
  const { isSpotifyLinked } = useUser();
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);

  useEffect(() => {
    if (!isSpotifyLinked) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetch('/api/spotify/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { display_name?: string | null; images?: { url: string }[]; id?: string } | null) => {
        if (cancelled || !data) return;
        const image = data.images?.[0]?.url ?? null;
        setProfile({
          display_name: data.display_name ?? null,
          image,
          id: data.id ?? '',
        });
      })
      .catch(() => setProfile(null));
    return () => {
      cancelled = true;
    };
  }, [isSpotifyLinked]);

  return profile;
}
