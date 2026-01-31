'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { CoverImage } from '@/components/CoverImage';
import type { NavidromePlaylistSummary } from '@/actions/getNavidromePlaylists';

interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total?: number };
  external_urls?: { spotify?: string };
}

interface PlaylistsContentProps {
  navidromePlaylists: NavidromePlaylistSummary[];
}

export function PlaylistsContent({ navidromePlaylists }: PlaylistsContentProps) {
  const { isSpotifyLinked } = useUser();
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  useEffect(() => {
    if (!isSpotifyLinked) {
      setSpotifyPlaylists([]);
      return;
    }
    setSpotifyLoading(true);
    fetch('/api/spotify/user/playlists?limit=50', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: SpotifyPlaylist[] } | null) => {
        setSpotifyPlaylists(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setSpotifyPlaylists([]))
      .finally(() => setSpotifyLoading(false));
  }, [isSpotifyLinked]);

  return (
    <div className="space-y-8">
      {navidromePlaylists.length > 0 && (
        <section>
          <h2 className="text-white text-xl font-semibold mb-4">Your playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {navidromePlaylists.map((p) => (
              <Link
                key={p.id}
                href={`/playlist/${encodeURIComponent(p.id)}`}
                className="group flex flex-col gap-y-2 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden">
                  <CoverImage
                    src="/images/liked.png"
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                </div>
                <p className="text-white font-medium text-sm truncate">{p.name}</p>
                {p.songCount != null && (
                  <p className="text-neutral-400 text-xs">{p.songCount} songs</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {isSpotifyLinked && (
        <section>
          <h2 className="text-white text-xl font-semibold mb-4">From Spotify</h2>
          {spotifyLoading ? (
            <p className="text-neutral-400 text-sm">Loading Spotify playlists…</p>
          ) : spotifyPlaylists.length === 0 ? (
            <p className="text-neutral-400 text-sm">No Spotify playlists.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {spotifyPlaylists.map((pl) => {
                const img = pl.images?.[0]?.url ?? '/images/liked.png';
                return (
                  <Link
                    key={pl.id}
                    href={`/playlist/spotify/${encodeURIComponent(pl.id)}`}
                    className="group flex flex-col gap-y-2 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden">
                      <CoverImage
                        src={img}
                        alt={pl.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 20vw"
                      />
                    </div>
                    <p className="text-white font-medium text-sm truncate">{pl.name}</p>
                    {pl.tracks?.total != null && (
                      <p className="text-neutral-400 text-xs">{pl.tracks.total} tracks</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {navidromePlaylists.length === 0 && (!isSpotifyLinked || spotifyPlaylists.length === 0) && !spotifyLoading && (
        <p className="text-neutral-400">No playlists yet. Connect Spotify or create playlists in Navidrome.</p>
      )}
    </div>
  );
}
