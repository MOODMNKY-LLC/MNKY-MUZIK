'use client';

import { usePlayer } from '@/hooks/usePlayer';
import { useLoadImage } from '@/hooks/useLoadImage';
import { CoverImage } from '@/components/CoverImage';
import { LikeButton } from '@/components/LikeButton';
import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';
import { MdClose } from 'react-icons/md';
import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { MdShuffle, MdRepeat, MdRepeatOne } from 'react-icons/md';

interface NowPlayingExpandedProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  progress: number;
  durationSec: number;
  currentTime: number;
  onProgressChange: (value: number) => void;
  formatTime: (sec: number) => string;
}

export function NowPlayingExpanded({
  track,
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  progress,
  durationSec,
  currentTime,
  onProgressChange,
  formatTime,
}: NowPlayingExpandedProps) {
  const player = usePlayer();
  const imageUrl = useLoadImage(track);
  const author = isSupabaseTrack(track) ? track.author : (track.artist ?? '');
  const Icon = isPlaying ? BsPauseFill : BsPlayFill;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      <div className="flex items-center justify-between p-4 shrink-0">
        <button
          type="button"
          onClick={() => player.setExpanded(false)}
          className="p-2 rounded-full text-neutral-400 hover:text-white transition"
          aria-label="Close"
        >
          <MdClose size={28} />
        </button>
        <p className="text-neutral-400 text-sm font-medium">Now playing</p>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 min-h-0">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-lg overflow-hidden shadow-2xl shrink-0 mb-8">
          <CoverImage
            fill
            src={imageUrl || '/images/liked.png'}
            alt={track.title}
            className="object-cover"
            sizes="320px"
          />
        </div>
        <div className="flex items-center gap-x-3 w-full max-w-md mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-2xl font-bold truncate">{track.title}</h2>
            <p className="text-neutral-400 truncate">{author}</p>
          </div>
          <LikeButton track={track} />
        </div>

        <div className="w-full max-w-md mt-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-neutral-500 tabular-nums w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              onChange={(e) => onProgressChange(parseFloat(e.target.value))}
              className="flex-1 h-1 rounded-full accent-emerald-500"
              aria-label="Progress"
            />
            <span className="text-xs text-neutral-500 tabular-nums w-10">
              {durationSec > 0 ? formatTime(durationSec) : '0:00'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-x-6 mb-8">
          <MdShuffle
            size={26}
            onClick={() => player.toggleShuffle()}
            className={`cursor-pointer transition ${
              player.shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'
            }`}
          />
          <AiFillBackward
            size={32}
            onClick={onPrevious}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <button
            type="button"
            onClick={onPlayPause}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-white p-1 cursor-pointer"
          >
            <Icon size={36} className="text-black" />
          </button>
          <AiFillStepForward
            size={32}
            onClick={onNext}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
          />
          <button
            type="button"
            onClick={() => player.cycleRepeat()}
            className="text-neutral-400 hover:text-white transition"
            aria-label="Repeat"
          >
            {player.repeat === 'one' ? (
              <MdRepeatOne size={26} className="text-green-500" />
            ) : (
              <MdRepeat
                size={26}
                className={player.repeat === 'all' ? 'text-green-500' : ''}
              />
            )}
          </button>
        </div>

        <div className="w-full max-w-md flex-1 min-h-[120px] flex flex-col border-t border-neutral-800 pt-4">
          <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-3">
            Lyrics
          </h3>
          <div className="flex-1 flex items-center justify-center rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
            <p className="text-neutral-500 text-sm text-center">
              Lyrics not available. When a lyrics provider is connected, they will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
