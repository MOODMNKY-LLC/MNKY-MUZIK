'use client';

import { useState, useRef, useEffect } from 'react';
import { MdMoreVert } from 'react-icons/md';

export interface RequestDownloadTrack {
  title: string;
  artist?: string;
  album?: string;
}

interface QueueActionsMenuProps {
  onAddToQueue: () => void;
  onPlayNext: () => void;
  className?: string;
  /** When Lidarr is configured, show "Request download" to add this track for offline play. */
  lidarrConfigured?: boolean;
  track?: RequestDownloadTrack;
  onRequestDownload?: (track: RequestDownloadTrack) => void;
}

export function QueueActionsMenu({
  onAddToQueue,
  onPlayNext,
  className = '',
  lidarrConfigured,
  track,
  onRequestDownload,
}: QueueActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const showRequestDownload =
    Boolean(lidarrConfigured && track && (track.title || track.artist) && onRequestDownload);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        aria-label="Queue options"
        aria-expanded={open}
      >
        <MdMoreVert size={20} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 min-w-[160px] rounded-md bg-neutral-800 shadow-lg z-50 border border-neutral-700"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              onPlayNext();
              setOpen(false);
            }}
          >
            Play next
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue();
              setOpen(false);
            }}
          >
            Add to queue
          </button>
          {showRequestDownload && track && onRequestDownload && (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDownload(track);
                setOpen(false);
              }}
            >
              Request download
            </button>
          )}
        </div>
      )}
    </div>
  );
}
