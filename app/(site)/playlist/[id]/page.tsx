import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getNavidromePlaylistById, isNavidromeConfigured } from '@/actions/getNavidromePlaylists';
import { Header } from '@/components/Header';
import { TrackRow } from '@/components/TrackRow';

export const revalidate = 0;

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isNavidromeConfigured()) notFound();
  const data = await getNavidromePlaylistById(id);
  if (!data) notFound();

  const { name, tracks } = data;

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mt-20 relative overflow-hidden rounded-lg">
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
              <Image
                fill
                src="/images/mnky-muzik-wallpaper.png"
                alt={name}
                className="object-cover"
                sizes="224px"
              />
            </div>
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
              <p className="hidden md:block text-sm font-medium text-neutral-400">Playlist</p>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold truncate max-w-full">
                {name}
              </h1>
              <p className="text-neutral-400 text-sm">{tracks.length} songs</p>
            </div>
          </div>
        </div>
      </Header>
      <div className="mt-6 px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-y-2">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} tracks={tracks} />
          ))}
        </div>
      </div>
    </div>
  );
}
