import { notFound } from 'next/navigation';
import { getNavidromeArtistById, isNavidromeConfigured } from '@/actions/getNavidromeBrowse';
import { Header } from '@/components/Header';
import { AlbumCard } from '@/components/AlbumCard';
import { TrackRow } from '@/components/TrackRow';

export const revalidate = 0;

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isNavidromeConfigured()) notFound();
  const data = await getNavidromeArtistById(id);
  if (!data) notFound();

  const { name, albums, songs } = data;

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mt-20">
          <div className="flex flex-col gap-y-4">
            <p className="hidden md:block text-sm font-medium text-neutral-400">Artist</p>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold truncate max-w-full">
              {name || 'Unknown Artist'}
            </h1>
          </div>
        </div>
      </Header>
      <div className="mt-6 px-4 sm:px-6 pb-8 space-y-8">
        {albums.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-semibold mb-4">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}
        {songs.length > 0 && (
          <section>
            <h2 className="text-white text-2xl font-semibold mb-4">Tracks</h2>
            <div className="flex flex-col gap-y-2">
              {songs.map((track) => (
                <TrackRow key={track.id} track={track} tracks={songs} />
              ))}
            </div>
          </section>
        )}
        {albums.length === 0 && songs.length === 0 && (
          <p className="text-neutral-400">No albums or tracks found.</p>
        )}
      </div>
    </div>
  );
}
