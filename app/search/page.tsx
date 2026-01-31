import { getSongsByTitle } from '@/actions/getSongsByTitle';
import { getNavidromeSearch, isNavidromeConfigured } from '@/actions/getNavidromeBrowse';
import { Header } from '@/components/Header';
import { SearchInput } from '@/components/SearchInput';
import { SearchView } from './components/SearchView';

export const revalidate = 0;

interface SearchProps {
  searchParams: Promise<{ title?: string; q?: string }>;
}

const Search = async ({ searchParams }: SearchProps) => {
  const params = await searchParams;
  const query = (params.title ?? params.q ?? '').trim();

  const [songs, navidromeResult] = await Promise.all([
    getSongsByTitle(query),
    query && isNavidromeConfigured() ? getNavidromeSearch(query) : Promise.resolve(null),
  ]);

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold">Search</h1>
          <SearchInput initialQuery={query} />
        </div>
      </Header>
      <SearchView
        initialSongs={songs}
        initialNavidrome={navidromeResult}
        initialQuery={query}
      />
    </div>
  );
};

export default Search;
