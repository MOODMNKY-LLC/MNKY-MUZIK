import { getNavidromePlaylistsList, isNavidromeConfigured } from '@/actions/getNavidromePlaylists';
import { Header } from '@/components/Header';
import { PlaylistsContent } from './components/PlaylistsContent';

export const revalidate = 0;

export default async function PlaylistsPage() {
  const navidromePlaylists = isNavidromeConfigured() ? await getNavidromePlaylistsList() : [];

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">Playlists</h1>
        </div>
      </Header>
      <div className="mt-6 px-4 sm:px-6 pb-8">
        <PlaylistsContent navidromePlaylists={navidromePlaylists} />
      </div>
    </div>
  );
}
