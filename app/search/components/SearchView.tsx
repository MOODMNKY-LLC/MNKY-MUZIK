'use client';

import { useState, useEffect } from 'react';
import { SearchContent } from './SearchContent';
import type { Song } from '@/types';
import type { NavidromeSearchResult } from '@/actions/getNavidromeBrowse';

interface SearchViewProps {
  initialSongs: Song[];
  initialNavidrome: NavidromeSearchResult | null;
  initialQuery: string;
}

export function SearchView({
  initialSongs,
  initialNavidrome,
  initialQuery,
}: SearchViewProps) {
  const [songs, setSongs] = useState(initialSongs);
  const [navidrome, setNavidrome] = useState<NavidromeSearchResult | null>(initialNavidrome);
  const [query, setQuery] = useState(initialQuery);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [describeValue, setDescribeValue] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setSongs(initialSongs);
    setNavidrome(initialNavidrome);
    setQuery(initialQuery);
  }, [initialSongs, initialNavidrome, initialQuery]);

  useEffect(() => {
    fetch('/api/ai/configured', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setAiConfigured(data.configured === true))
      .catch(() => setAiConfigured(false));
  }, []);

  const handleDescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = describeValue.trim();
    if (!q || !aiConfigured) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/search/ai?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      const data = (await res.json()) as {
        songs?: Song[];
        navidrome?: NavidromeSearchResult | null;
        query?: string;
        error?: string;
      };
      if (res.ok && data.songs != null) {
        setSongs(data.songs);
        setNavidrome(data.navidrome ?? null);
        setQuery(data.query ?? q);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-6 w-full px-4 sm:px-6 pb-8">
      {aiConfigured && (
        <div className="flex flex-col gap-2">
          <label htmlFor="ai-describe-search" className="text-neutral-400 text-sm font-medium">
            Describe what you want (AI)
          </label>
          <form onSubmit={handleDescribeSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              id="ai-describe-search"
              type="text"
              value={describeValue}
              onChange={(e) => setDescribeValue(e.target.value)}
              placeholder="e.g. chill study music, upbeat 80s rock"
              className="
                flex-1 min-w-0 px-3 py-2 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 text-sm
                border border-neutral-700 focus:border-emerald-500 focus:outline-none
              "
              maxLength={200}
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={aiLoading || !describeValue.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition"
            >
              {aiLoading ? 'Searching…' : 'Describe search'}
            </button>
          </form>
        </div>
      )}
      <SearchContent songs={songs} navidrome={navidrome} query={query} />
    </div>
  );
}
