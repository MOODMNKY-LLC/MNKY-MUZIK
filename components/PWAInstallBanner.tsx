'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const BANNER_DISMISSED_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;

    if (standalone || dismissed === '1') {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-neutral-800 p-4 shadow-lg ring-1 ring-neutral-700 md:left-6"
      role="dialog"
      aria-label="Install MNKY MUZIK app"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-700">
          <Image
            src="/images/mnky-muzik-app-icon.png"
            alt=""
            fill
            className="object-contain"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Install MNKY MUZIK</p>
          <p className="text-sm text-neutral-400">Add to your home screen for a better experience.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-600"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
