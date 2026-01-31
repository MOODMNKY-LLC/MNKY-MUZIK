'use client';

import dynamic from 'next/dynamic';

/**
 * Load QueueDrawer in a separate chunk to avoid pulling its dependency tree
 * into the main bundle (can trigger webpack "options.factory" undefined errors).
 */
const QueueDrawer = dynamic(
  () => import('@/components/QueueDrawer').then((mod) => ({ default: mod.QueueDrawer })),
  { ssr: false }
);

export function QueueDrawerWrapper() {
  return <QueueDrawer />;
}
