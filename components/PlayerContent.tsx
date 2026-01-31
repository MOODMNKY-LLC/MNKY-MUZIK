'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Track } from '@/types';

import { usePlayer } from '@/hooks/usePlayer';
import { usePlaybackState } from '@/providers/PlaybackStateContext';

import { BsPauseFill, BsPlayFill } from 'react-icons/bs';
import { AiFillBackward, AiFillStepForward } from 'react-icons/ai';
import { HiSpeakerXMark, HiSpeakerWave } from 'react-icons/hi2';
import { MdShuffle, MdRepeat, MdRepeatOne, MdQueueMusic, MdFullscreen } from 'react-icons/md';

import { MediaItem } from './MediaItem';
import { LikeButton } from './LikeButton';
import { Slider } from './Slider';
import useSound from 'use-sound';

interface PlayerContentProps {
  track: Track;
  songUrl: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlayerContent: React.FC<PlayerContentProps> = ({ track, songUrl }) => {
  const player = usePlayer();
  const { setPlaybackState } = usePlaybackState();
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const order =
    player.shuffle && player.shuffledIds?.length
      ? player.shuffledIds
      : player.ids;

  const onPlayNextSong = useCallback(() => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= order.length) {
      if (player.repeat === 'all') player.setId(order[0]);
      return;
    }
    player.setId(order[nextIndex]);
  }, [order, player.activeId, player.repeat, player.setId]);

  const onPlayPreviousSong = useCallback(() => {
    if (order.length === 0) return;
    const currentIndex = order.indexOf(player.activeId ?? '');
    if (currentIndex < 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (player.repeat === 'all') player.setId(order[order.length - 1]);
      return;
    }
    player.setId(order[prevIndex]);
  }, [order, player.activeId, player.repeat, player.setId]);

  const [play, { pause, sound, duration: durationMs }] = useSound(songUrl, {
    volume: volume,
    onplay: () => setIsPlaying(true),
    onend: () => {
      setIsPlaying(false);
      if (track.source === 'navidrome') {
        fetch('/api/navidrome/scrobble', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: track.id }),
        }).catch(() => {});
      }
      if (player.repeat === 'one') {
        play();
      } else {
        onPlayNextSong();
      }
    },
    onpause: () => setIsPlaying(false),
    format: ['mp3'],
  });

  //* Automatcially play the song when the player component loads
  useEffect(() => {
    sound?.play();
    return () => {
      sound?.unload();
    };
  }, [sound]);

  //* Sync current time from sound while playing (skip while user is scrubbing)
  useEffect(() => {
    if (!sound || !isPlaying || isScrubbing) return;
    const tick = () => {
      const pos = typeof (sound as { seek: (s?: number) => number }).seek === 'function'
        ? (sound as { seek: (s?: number) => number }).seek()
        : null;
      const sec = typeof pos === 'number' && !Number.isNaN(pos) ? pos : 0;
      setCurrentTime(sec);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [sound, isPlaying, isScrubbing]);

  //* Reset current time when track changes
  useEffect(() => {
    setCurrentTime(0);
  }, [songUrl]);

  // use-sound returns duration in milliseconds; convert to seconds for display and progress
  const durationSec = durationMs != null ? durationMs / 1000 : 0;
  const progress = durationSec > 0 ? currentTime / durationSec : 0;

  const handleProgressChange = useCallback(
    (value: number) => {
      if (!sound || !durationSec) return;
      const sec = value * durationSec;
      setCurrentTime(sec);
      if (typeof (sound as { seek: (s?: number) => number }).seek === 'function') {
        (sound as { seek: (s: number) => number }).seek(sec);
      }
    },
    [sound, durationSec]
  );

  const handlePlay = useCallback(() => {
    if (!isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  // Expose playback state to expanded view (PlaybackStateContext)
  useEffect(() => {
    setPlaybackState({
      isPlaying,
      currentTime,
      durationSec,
      progress,
      onPlayPause: handlePlay,
      onPrevious: onPlayPreviousSong,
      onNext: onPlayNextSong,
      onProgressChange: handleProgressChange,
      formatTime,
    });
  }, [
    isPlaying,
    currentTime,
    durationSec,
    progress,
    setPlaybackState,
    handlePlay,
    onPlayPreviousSong,
    onPlayNextSong,
    handleProgressChange,
  ]);

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(1);
    } else {
      setVolume(0);
    }
  };

  const progressBar = (
    <div className="flex items-center gap-3 min-w-0 w-full max-w-[540px]">
      <span className="w-10 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
        {formatTime(currentTime)}
      </span>
      <div className="flex-1 min-w-0">
        <Slider
          value={progress}
          onChange={(v) => {
            setIsScrubbing(true);
            handleProgressChange(v);
          }}
          onValueChangeCommit={() => setIsScrubbing(false)}
          step={0.001}
          ariaLabel="Track progress"
        />
      </div>
      <span className="w-10 shrink-0 text-xs text-neutral-400 tabular-nums">
        {durationSec > 0 ? formatTime(durationSec) : '0:00'}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className="
        grid
        grid-cols-2
        md:grid-cols-3
        h-full
        items-center
        "
      >
        <div className="flex w-full justify-start items-center gap-x-2 min-w-0">
          <div className="flex items-center gap-x-2 md:gap-x-4 min-w-0 flex-1">
            <MediaItem data={track} />
            <LikeButton track={track} />
          </div>
          <button
            type="button"
            onClick={() => player.setQueueOpen(true)}
            className="p-2 rounded-full text-neutral-400 hover:text-white transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center shrink-0"
            aria-label="Open queue"
          >
            <MdQueueMusic size={22} />
          </button>
          <button
            type="button"
            onClick={() => player.setExpanded(true)}
            className="p-2 rounded-full text-neutral-400 hover:text-white transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center shrink-0"
            aria-label="Expand now playing"
          >
            <MdFullscreen size={22} />
          </button>
        </div>

        <div className="flex md:hidden col-auto w-full justify-end items-center shrink-0">
          <button
            type="button"
            onClick={handlePlay}
            className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-full bg-white p-1 cursor-pointer shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon size={30} className="text-black" />
          </button>
        </div>

        {/* Desktop: center column = playback commands + progress bar below (Spotify-style) */}
        <div className="hidden md:flex flex-col items-center justify-center w-full max-w-[722px] gap-1">
          <div className="flex items-center gap-x-4">
            <MdShuffle
              size={22}
              onClick={() => player.toggleShuffle()}
              className={`cursor-pointer transition ${
                player.shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'
              }`}
            />
            <AiFillBackward
              onClick={onPlayPreviousSong}
              size={28}
              className="text-neutral-400 cursor-pointer hover:text-white transition"
            />
            <div
              onClick={handlePlay}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
            >
              <Icon size={30} className="text-black" />
            </div>
            <AiFillStepForward
              onClick={onPlayNextSong}
              size={28}
              className="text-neutral-400 cursor-pointer hover:text-white transition"
            />
            <button
              type="button"
              onClick={() => player.cycleRepeat()}
              className="flex items-center justify-center text-neutral-400 hover:text-white transition"
              aria-label="Repeat"
            >
              {player.repeat === 'one' ? (
                <MdRepeatOne size={22} className="text-green-500" />
              ) : (
                <MdRepeat
                  size={22}
                  className={player.repeat === 'all' ? 'text-green-500' : ''}
                />
              )}
            </button>
          </div>
          {/* Progress bar below playback commands, centered, constrained width */}
          {progressBar}
        </div>

        <div className="hidden md:flex w-full justify-end pr-2">
          <div className="flex items-center gap-x-2 w-[120px]">
            <VolumeIcon onClick={toggleMute} className="cursor-pointer" size={34} />
            <Slider value={volume} onChange={(value) => setVolume(value)} />
          </div>
        </div>
      </div>

      {/* Mobile: progress bar full width below the grid */}
      <div className="flex md:hidden items-center gap-3 w-full min-w-0 px-0">
        {progressBar}
      </div>
    </div>
  );
};
