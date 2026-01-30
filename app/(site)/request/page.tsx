import { isLidarrConfigured } from '@/libs/lidarr';
import { Header } from '@/components/Header';
import { RequestContent } from './components/RequestContent';

export const revalidate = 0;

export default async function RequestPage() {
  const configured = isLidarrConfigured();

  return (
    <div className="bg-neutral-900 rounded-lg w-full">
      <Header>
        <div className="mb-2 flex flex-col gap-y-6">
          <h1 className="text-white text-3xl font-semibold">Request music</h1>
          <p className="text-neutral-400 text-sm">
            Search for an artist or album and request it to be added to your library. Lidarr will
            download it and Navidrome will pick it up.
          </p>
        </div>
      </Header>
      <RequestContent configured={configured} />
    </div>
  );
}
