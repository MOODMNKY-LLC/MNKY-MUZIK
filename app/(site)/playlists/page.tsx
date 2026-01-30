import Link from 'next/link';
import { getNavidromePlaylistsList, isNavidromeConfigured } from '@/actions/getNavidromePlaylists';
import { Header } from '@/components/Header';
import { ListItem } from '@/components/ListItem';

export const revalidate = 0;

export default async function PlaylistsPage() {
  if (!isNavidromeConfigured()) {
    return (
      <div className="bg-neutral-900 rounded-lg w-full px-4 sm:px-6 py-8">
        <Header>
          <h1 className="text-white text-3xl font-semibold">Playlists</h1>
        </Header>
        <p className="text-neutral-400 mt-4">Navidrome is not configured.</p>
      </div>
    );
  }

  const playlists = await getNavidromePlaylistsList();

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">Playlists</h1>
        </div>
      </Header>
      <div className="mt-6 px-4 sm:px-6 pb-8">
        {playlists.length === 0 ? (
          <p className="text-neutral-400">No playlists yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((p) => (
              <ListItem
                key={p.id}
                name={p.name}
                href={`/playlist/${encodeURIComponent(p.id)}`}
                image="/images/liked.png"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
