import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CoverImage } from '@/components/CoverImage';
import { getNavidromeAlbumById, isNavidromeConfigured } from '@/actions/getNavidromeBrowse';
import { enrichAlbumByQuery, isSpotifyConfigured } from '@/libs/spotify';
import { Header } from '@/components/Header';
import { TrackRow } from '@/components/TrackRow';

function coverImageUrl(coverArt?: string): string {
  if (!coverArt) return '/images/liked.png';
  return `/api/navidrome/cover?id=${encodeURIComponent(coverArt)}`;
}

function isApiCover(src: string): boolean {
  return src.startsWith('/api/');
}

export const revalidate = 0;

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isNavidromeConfigured()) notFound();
  const data = await getNavidromeAlbumById(id);
  if (!data) notFound();

  const { album, songs } = data;
  const enrichment =
    isSpotifyConfigured() && album.name && album.artist
      ? await enrichAlbumByQuery(album.name, album.artist)
      : null;
  const coverSrc = enrichment?.imageUrl ?? coverImageUrl(album.coverArt);
  const useExternalCover = Boolean(enrichment?.imageUrl);

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mt-20">
          <div className="flex flex-col md:flex-row items-center gap-x-6 gap-y-4">
            <div className="relative w-44 h-44 lg:w-56 lg:h-56 rounded-lg overflow-hidden shadow-2xl">
              <CoverImage
                fill
                src={coverSrc}
                alt={album.name}
                className="object-cover"
                sizes="224px"
                unoptimized={useExternalCover || isApiCover(coverSrc)}
              />
            </div>
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
              <p className="hidden md:block text-sm font-medium text-neutral-400">Album</p>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-bold truncate max-w-full">
                {album.name}
              </h1>
              <p className="text-neutral-400 text-lg">{album.artist ?? 'Unknown'}</p>
              <p className="text-neutral-400 text-sm">{songs.length} songs</p>
              {enrichment?.spotifyUrl && (
                <Link
                  href={enrichment.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-500 hover:underline mt-1"
                >
                  View on Spotify
                </Link>
              )}
            </div>
          </div>
        </div>
      </Header>
      <div className="mt-6 px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-y-2">
          {songs.map((track) => (
            <TrackRow key={track.id} track={track} tracks={songs} />
          ))}
        </div>
      </div>
    </div>
  );
}
