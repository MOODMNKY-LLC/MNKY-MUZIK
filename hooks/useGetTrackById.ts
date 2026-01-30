import type { Track, SupabaseTrack, NavidromeTrack } from '@/types';
import { NAVIDROME_ID_PREFIX } from '@/types';
import { useSupabaseClient } from '@/providers/SupabaseProvider';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

export function useGetTrackById(activeId?: string): { track: Track | undefined; isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const [track, setTrack] = useState<Track | undefined>(undefined);
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    if (!activeId) {
      setTrack(undefined);
      return;
    }

    setIsLoading(true);
    setTrack(undefined);

    const fetchTrack = async () => {
      if (activeId.startsWith(NAVIDROME_ID_PREFIX)) {
        const navidromeId = activeId.slice(NAVIDROME_ID_PREFIX.length);
        try {
          const base = typeof window !== 'undefined' ? window.location.origin : '';
          const res = await fetch(`${base}/api/navidrome/track/${encodeURIComponent(navidromeId)}`);
          if (!res.ok) {
            toast.error('Track not found');
            return;
          }
          const data = (await res.json()) as NavidromeTrack;
          setTrack(data);
        } catch {
          toast.error('Failed to load track');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabaseClient
        .from('songs')
        .select('*')
        .eq('id', Number(activeId))
        .single();

      if (error) {
        toast.error(error.message);
        setTrack(undefined);
      } else if (data) {
        setTrack({ ...(data as Record<string, unknown>), source: 'supabase' } as SupabaseTrack);
      }
      setIsLoading(false);
    };

    fetchTrack();
  }, [activeId, supabaseClient]);

  return useMemo(() => ({ track, isLoading }), [track, isLoading]);
}
