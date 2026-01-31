'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';
import { useUser } from '@/hooks/useUser';
import { toast } from 'react-hot-toast';
import type { EnrichedRequestArtist, EnrichedRequestAlbum } from '@/types';

interface MusicRequest {
  id: string;
  type: string;
  title: string;
  artist_name: string | null;
  status: string;
  created_at: string | null;
}

interface RequestContentProps {
  configured: boolean;
}

export function RequestContent({ configured }: RequestContentProps) {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [artists, setArtists] = useState<EnrichedRequestArtist[]>([]);
  const [albums, setAlbums] = useState<EnrichedRequestAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [expandedOverview, setExpandedOverview] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<MusicRequest[]>([]);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!user) {
      setRequestHistory([]);
      return;
    }
    fetch('/api/request/history', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { requests?: MusicRequest[] }) => setRequestHistory(data.requests ?? []))
      .catch(() => setRequestHistory([]));
  }, [user]);

  const isRequested = (displayLabel: string) => {
    const label = displayLabel.toLowerCase();
    return requestHistory.some((r) => r.title.toLowerCase().includes(label));
  };

  const search = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setArtists([]);
      setAlbums([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/request/search?q=${encodeURIComponent(debouncedQuery)}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Search failed');
        setArtists([]);
        setAlbums([]);
        return;
      }

      setArtists(Array.isArray(data.artists) ? data.artists : []);
      setAlbums(Array.isArray(data.albums) ? data.albums : []);
    } catch {
      setError('Search failed');
      setArtists([]);
      setAlbums([]);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    search();
  }, [search]);

  const handleRequestArtist = async (artist: EnrichedRequestArtist) => {
    const name = String(artist.artistName ?? artist.name ?? 'Unknown');
    setRequesting(name);
    try {
      const res = await fetch('/api/lidarr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'artist', artist }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Request failed');
        return;
      }
      setRequestHistory((prev) => [
        { id: crypto.randomUUID(), type: 'artist', title: name, artist_name: name, status: 'requested', created_at: new Date().toISOString() },
        ...prev,
      ]);
      toast.success(
        artist.alreadyInLibrary
          ? 'Already in your library'
          : 'Artist added. It will download and appear in your library when ready.'
      );
    } catch {
      toast.error('Request failed');
    } finally {
      setRequesting(null);
    }
  };

  const handleRequestAlbum = async (album: EnrichedRequestAlbum) => {
    const artistName =
      typeof album.artist === 'object' && album.artist
        ? String(
            (album.artist as { artistName?: string; name?: string }).artistName ??
              (album.artist as { name?: string }).name ??
              ''
          )
        : String(album.artistName ?? '');
    const label = artistName ? `${artistName} – ${album.title ?? ''}` : String(album.title ?? '');
    setRequesting(label);
    try {
      const res = await fetch('/api/lidarr/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'album', album }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Request failed');
        return;
      }
      setRequestHistory((prev) => [
        { id: crypto.randomUUID(), type: 'album', title: label, artist_name: artistName || null, status: 'requested', created_at: new Date().toISOString() },
        ...prev,
      ]);
      toast.success(
        album.alreadyInLibrary
          ? 'Already in your library'
          : 'Album added. It will download and appear in your library when ready.'
      );
    } catch {
      toast.error('Request failed');
    } finally {
      setRequesting(null);
    }
  };

  if (!configured) {
    return (
      <div className="px-4 sm:px-6 py-8 text-neutral-400">
        Lidarr is not configured. Set LIDARR_URL and LIDARR_API_KEY in your
        environment.
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pb-8 space-y-6">
      {user && requestHistory.length > 0 && (
        <section>
          <h2 className="text-white text-xl font-semibold mb-3">Your requests</h2>
          <ul className="space-y-2">
            {requestHistory.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-neutral-800/50 px-4 py-2"
              >
                <span className="text-white text-sm truncate">{r.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                    r.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-600/50 text-neutral-400'
                  }`}
                >
                  {r.status === 'available' ? 'In library' : 'Requested'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search artist or album..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="flex-1 rounded-md bg-neutral-800 px-4 py-2 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-md bg-green-500 px-4 py-2 font-medium text-black hover:bg-green-400 disabled:opacity-50 min-w-[100px]"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <p className="text-amber-400 text-sm">
          {error}. Try different terms or check that Lidarr is running.
        </p>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="h-16 rounded-lg bg-neutral-800/50 animate-pulse" />
          <div className="h-16 rounded-lg bg-neutral-800/50 animate-pulse" />
          <div className="h-16 rounded-lg bg-neutral-800/50 animate-pulse" />
        </div>
      )}

      {!loading && artists.length > 0 && (
        <section>
          <h2 className="text-white text-xl font-semibold mb-3">Artists</h2>
          <ul className="space-y-3">
            {artists.map((artist, i) => {
              const name = String(artist.artistName ?? artist.name ?? 'Unknown');
              const id = String(artist.foreignArtistId ?? artist.id ?? i);
              const disambiguation = artist.disambiguation
                ? ` (${artist.disambiguation})`
                : '';
              const overviewKey = `artist-${id}`;
              const showOverview = expandedOverview === overviewKey;

              return (
                <li
                  key={id}
                  className="flex items-start gap-4 rounded-lg bg-neutral-800/50 p-4"
                >
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-neutral-700 shrink-0">
                    {artist.imageUrl ? (
                      <Image
                        src={artist.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized={!artist.imageUrl?.includes('i.scdn.co')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {name}
                        {disambiguation && (
                          <span className="text-neutral-400 font-normal">
                            {disambiguation}
                          </span>
                        )}
                      </span>
                      {artist.alreadyInLibrary && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          In library
                        </span>
                      )}
                      {!artist.alreadyInLibrary && isRequested(name) && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Requested
                        </span>
                      )}
                    </div>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-neutral-400 text-sm mt-0.5 truncate">
                        {artist.genres.slice(0, 3).join(', ')}
                      </p>
                    )}
                    {artist.overview && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOverview(showOverview ? null : overviewKey)
                          }
                          className="text-neutral-400 text-xs hover:text-white"
                        >
                          {showOverview ? 'Less' : 'More'}
                        </button>
                        {showOverview && (
                          <p className="text-neutral-400 text-sm mt-1 line-clamp-4">
                            {artist.overview}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {artist.spotifyUrl && (
                      <a
                        href={artist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-white text-sm"
                        aria-label="Open on Spotify"
                      >
                        Spotify
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRequestArtist(artist)}
                      disabled={requesting !== null}
                      className="rounded bg-green-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-green-400 disabled:opacity-50"
                    >
                      {requesting === name
                        ? 'Requesting...'
                        : artist.alreadyInLibrary
                          ? 'Request anyway'
                          : 'Request'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!loading && albums.length > 0 && (
        <section>
          <h2 className="text-white text-xl font-semibold mb-3">Albums</h2>
          <ul className="space-y-3">
            {albums.map((album, i) => {
              const title = String(album.title ?? 'Unknown');
              const artistName =
                typeof album.artist === 'object' && album.artist
                  ? String(
                      (album.artist as { artistName?: string; name?: string })
                        .artistName ??
                        (album.artist as { name?: string }).name ??
                        ''
                    )
                  : String(album.artistName ?? '');
              const id = String(album.foreignAlbumId ?? album.id ?? i);
              const releaseDate = album.releaseDate
                ? new Date(album.releaseDate).getFullYear()
                : null;

              return (
                <li
                  key={id}
                  className="flex items-start gap-4 rounded-lg bg-neutral-800/50 p-4"
                >
                  <div className="relative w-14 h-14 rounded-md overflow-hidden bg-neutral-700 shrink-0">
                    {album.imageUrl ? (
                      <Image
                        src={album.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized={!album.imageUrl?.includes('i.scdn.co')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block truncate">
                      {title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {artistName && (
                        <span className="text-neutral-400 text-sm truncate">
                          {artistName}
                        </span>
                      )}
                      {releaseDate && (
                        <span className="text-neutral-500 text-sm">
                          {releaseDate}
                        </span>
                      )}
                      {album.alreadyInLibrary && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          In library
                        </span>
                      )}
                      {!album.alreadyInLibrary && isRequested(artistName ? `${artistName} – ${title}` : title) && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Requested
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {album.spotifyUrl && (
                      <a
                        href={album.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-white text-sm"
                        aria-label="Open on Spotify"
                      >
                        Spotify
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRequestAlbum(album)}
                      disabled={requesting !== null}
                      className="rounded bg-green-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-green-400 disabled:opacity-50"
                    >
                      {requesting === `${artistName} – ${title}`
                        ? 'Requesting...'
                        : album.alreadyInLibrary
                          ? 'Request anyway'
                          : 'Request'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {debouncedQuery && !loading && !error && artists.length === 0 && albums.length === 0 && (
        <p className="text-neutral-400">
          No results for &quot;{debouncedQuery}&quot;. Try different terms or
          check spelling.
        </p>
      )}
    </div>
  );
}
