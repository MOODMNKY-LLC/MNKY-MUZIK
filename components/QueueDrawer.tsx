'use client';

import { usePlayer } from '@/hooks/usePlayer';
import { QueueItem } from './QueueItem';
import { MdClose } from 'react-icons/md';

export function QueueDrawer() {
  const player = usePlayer();
  const order = player.queueOrder();
  const activeId = player.activeId;
  const isOpen = player.isQueueOpen;

  if (!isOpen) return null;

  const currentIndex = activeId ? order.indexOf(activeId) : -1;
  const upNextIds = currentIndex < 0 ? order : order.slice(currentIndex + 1);
  const nowPlayingId = activeId ?? (order.length > 0 ? order[0] : undefined);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 md:z-40"
        aria-hidden
        onClick={() => player.setQueueOpen(false)}
      />
      <div
        className="
          fixed right-0 top-0 bottom-0 w-full max-w-sm bg-neutral-900 z-50
          flex flex-col shadow-2xl
          animate-in slide-in-from-right duration-200
        "
        role="dialog"
        aria-label="Queue"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-white font-semibold text-lg">Queue</h2>
          <button
            type="button"
            onClick={() => player.setQueueOpen(false)}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Close queue"
          >
            <MdClose size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {nowPlayingId && (
            <div className="mb-4">
              <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider px-2 pb-2">
                Now playing
              </p>
              <QueueItem
                id={nowPlayingId}
                isActive
                onRemove={(id) => player.removeFromQueue(id)}
              />
            </div>
          )}
          {upNextIds.length > 0 && (
            <div>
              <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider px-2 pb-2">
                Up next
              </p>
              <div className="flex flex-col gap-y-0.5">
                {upNextIds.map((id) => (
                  <QueueItem
                    key={id}
                    id={id}
                    onRemove={(id) => player.removeFromQueue(id)}
                  />
                ))}
              </div>
            </div>
          )}
          {order.length === 0 && (
            <p className="text-neutral-500 text-sm px-2 py-4">Queue is empty</p>
          )}
        </div>
      </div>
    </>
  );
}
