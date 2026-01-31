'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/components/MediaItem';
import { LikeButton } from '@/components/LikeButton';
import { useOnPlay } from '@/hooks/useOnPlay';
import { useQueueActions } from '@/hooks/useQueueActions';
import type { Track } from '@/types';
import { toast } from 'react-hot-toast';

export function AICreatePlaylistSection() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    fetch('/api/ai/configured', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setConfigured(data.configured === true))
      .catch(() => setConfigured(false));
  }, []);

  const onPlay = useOnPlay(tracks);
  const { addTrackToQueue, playTrackNext } = useQueueActions(tracks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setLoading(true);
    setTracks([]);
    try {
      const res = await fetch('/api/ai/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
        credentials: 'include',
      });
      const data = (await res.json()) as { tracks?: Track[]; error?: string };
      if (!res.ok) {
        const msg = data.error ?? (res.status === 503 ? 'OpenAI not configured' : 'Failed to create playlist');
        toast.error(msg);
        return;
      }
      setTracks(data.tracks ?? []);
      if ((data.tracks ?? []).length === 0) {
        toast('No matching tracks found. Try a different prompt.');
      }
    } catch {
      toast.error('Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  if (configured === null) return null;
  if (configured === false) {
    return (
      <section className="mt-6">
        <h2 className="text-white text-2xl font-semibold mb-4">Create with AI</h2>
        <p className="text-neutral-400 text-sm">
          AI features require an OpenAI API key. Set OPENAI_API_KEY in your environment to enable.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-white text-2xl font-semibold mb-4">Create with AI</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. chill study music, upbeat 80s rock"
          className="
            flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-neutral-800 text-white placeholder-neutral-500
            border border-neutral-700 focus:border-emerald-500 focus:outline-none
          "
          maxLength={500}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="
            px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium
            hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition
          "
        >
          {loading ? 'Creating…' : 'Create playlist'}
        </button>
      </form>
      {tracks.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <p className="text-neutral-400 text-sm mb-2">Suggested tracks — play or add to queue</p>
          {tracks.map((track) => (
            <div key={track.id + track.source} className="flex items-center gap-x-4 w-full">
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
          ))}
        </div>
      )}
    </section>
  );
}
