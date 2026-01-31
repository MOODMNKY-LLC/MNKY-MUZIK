'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CoverImage } from '@/components/CoverImage';
import { PlayButton } from '@/components/PlayButton';
import { useOnPlay } from '@/hooks/useOnPlay';
import type { SpotifyTrack } from '@/types';

interface SpotifyPlaylistTrackItem {
  track: {
    id: string;
    name: string;
    duration_ms?: number;
    artists?: { id: string; name: string }[];
    album?: { id: string; name: string; images?: { url: string }[] };
    external_urls?: { spotify?: string };
  } | null;
}

interface SpotifyPlaylistData {
  id: string;
  name: string;
  description: string | null;
  images?: { url: string }[];
  tracks: {
    items: SpotifyPlaylistTrackItem[];
    total: number;
  };
  external_urls?: { spotify?: string };
}

export default function SpotifyPlaylistPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<SpotifyPlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/spotify/user/playlist/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Failed to load playlist'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;
  if (loading) return <div className="px-4 sm:px-6 py-8 text-neutral-400">Loading…</div>;
  if (error || !data) {
    return (
      <div className="px-4 sm:px-6 py-8">
        <p className="text-amber-400">{error ?? 'Playlist not found'}</p>
        <Link href="/playlists" className="text-emerald-400 hover:underline mt-2 inline-block">
          Back to playlists
        </Link>
      </div>
    );
  }

  const img = data.images?.[0]?.url ?? '/images/liked.png';
  const tracks = data.tracks?.items?.filter((i) => i.track != null) ?? [];

  const spotifyTracks: SpotifyTrack[] = useMemo(
    () =>
      tracks.map((item) => {
        const t = item.track!;
        return {
          id: t.id,
          source: 'spotify',
          title: t.name,
          artist: t.artists?.map((a) => a.name).join(', '),
          coverArt: t.album?.images?.[0]?.url,
          uri: `spotify:track:${t.id}`,
        };
      }),
    [tracks]
  );
  const onPlay = useOnPlay(spotifyTracks);

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <div className="relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/mnky-muzik-wallpaper.png"
            alt=""
            fill
            className="object-cover object-center blur-2xl scale-110"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/60" aria-hidden />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-x-6 gap-y-4 p-6">
          <div className="relative w-44 h-44 lg:w-56 lg:h-56 rounded-lg overflow-hidden shadow-2xl bg-neutral-800 shrink-0">
            <CoverImage
              src={img}
              alt={data.name}
              fill
              className="object-cover"
              sizes="224px"
            />
          </div>
          <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
            <p className="hidden md:block text-sm font-medium text-neutral-400">Playlist</p>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold truncate max-w-full">
              {data.name}
            </h1>
            <p className="text-neutral-400 text-sm">{data.tracks.total ?? tracks.length} tracks</p>
            {data.external_urls?.spotify && (
              <a
                href={data.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium mt-1"
              >
                Open in Spotify
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-y-2">
          {tracks.map((item, i) => {
            const t = item.track!;
            const artistNames = t.artists?.map((a) => a.name).join(', ') ?? '';
            const trackImg = t.album?.images?.[0]?.url ?? '/images/liked.png';
            return (
              <div
                key={t.id ?? i}
                className="flex items-center gap-x-4 rounded-lg p-3 hover:bg-neutral-800/50 transition group"
              >
                <div className="relative w-12 h-12 rounded overflow-hidden bg-neutral-700 shrink-0">
                  <CoverImage src={trackImg} alt="" fill className="object-cover" sizes="48px" />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40"
                    onClick={() => onPlay(`spotify:${t.id}`)}
                  >
                    <PlayButton />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{t.name}</p>
                  <p className="text-neutral-400 text-sm truncate">{artistNames}</p>
                </div>
                {t.external_urls?.spotify && (
                  <a
                    href={t.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white text-sm shrink-0"
                  >
                    Open in Spotify
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
