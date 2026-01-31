'use client';

import { useState, useEffect } from 'react';

export function useLidarrConfigured(): boolean | null {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/lidarr/configured')
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setConfigured(data.configured === true))
      .catch(() => setConfigured(false));
  }, []);

  return configured;
}
