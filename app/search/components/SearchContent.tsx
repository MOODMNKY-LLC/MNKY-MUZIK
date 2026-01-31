'use client';

import Image from 'next/image';
import { useOnPlay } from '@/hooks/useOnPlay';
import { useQueueActions } from '@/hooks/useQueueActions';

import { LikeButton } from '@/components/LikeButton';
import { MediaItem } from '@/components/MediaItem';
import { AlbumCard } from '@/components/AlbumCard';
import { ArtistCard } from '@/components/ArtistCard';
import { TrackRow } from '@/components/TrackRow';

import type { Song, SupabaseTrack, Track } from '@/types';
import type { NavidromeSearchResult } from '@/actions/getNavidromeBrowse';

interface SearchContentProps {
  songs: Song[];
  navidrome: NavidromeSearchResult | null;
  query: string;
}

export const SearchContent: React.FC<SearchContentProps> = ({ songs, navidrome, query }) => {
  const supabaseTracks: SupabaseTrack[] = songs.map((s) => ({ ...s, source: 'supabase' }));
  const allTracks: Track[] = [
    ...supabaseTracks,
    ...(navidrome?.songs ?? []),
  ];
  const onPlay = useOnPlay(allTracks);
  const { addTrackToQueue, playTrackNext } = useQueueActions(allTracks);

  const hasSongs = allTracks.length > 0;
  const hasAlbums = (navidrome?.albums?.length ?? 0) > 0;
  const hasArtists = (navidrome?.artists?.length ?? 0) > 0;

  if (!query) {
    return (
      <div className="flex flex-col items-center gap-y-4 w-full px-4 sm:px-6 py-8 text-neutral-400">
        <Image
          src="/images/mnky-muzik-app-icon.png"
          alt=""
          width={48}
          height={48}
          className="object-contain opacity-80"
        />
        <p>Search for songs, albums, or artists.</p>
      </div>
    );
  }

  if (!hasSongs && !hasAlbums && !hasArtists) {
    return (
      <div className="flex flex-col items-center gap-y-4 w-full px-4 sm:px-6 py-8 text-neutral-400">
        <Image
          src="/images/mnky-muzik-app-icon.png"
          alt=""
          width={48}
          height={48}
          className="object-contain opacity-80"
        />
        <p>No results for &quot;{query}&quot;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-8 w-full px-4 sm:px-6 pb-8">
      {hasSongs && (
        <section>
          <h2 className="text-white text-2xl font-semibold mb-4">Songs</h2>
          <div className="flex flex-col gap-y-2">
            {allTracks.map((track) =>
              track.source === 'supabase' ? (
                <div key={track.id} className="flex items-center gap-x-4 w-full">
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
              ) : (
                <TrackRow
                  key={track.id}
                  track={track}
                  tracks={navidrome!.songs}
                  onAddToQueue={() => addTrackToQueue(track)}
                  onPlayNext={() => playTrackNext(track)}
                />
              )
            )}
          </div>
        </section>
      )}
      {hasAlbums && (
        <section>
          <h2 className="text-white text-2xl font-semibold mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {navidrome!.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
      {hasArtists && (
        <section>
          <h2 className="text-white text-2xl font-semibold mb-4">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {navidrome!.artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
