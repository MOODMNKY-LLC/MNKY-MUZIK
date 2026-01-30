'use client';

import Image from 'next/image';
import { Box } from '@/components/Box';
import { Triangle } from '@/components/TriangleLoader';

const Loading = () => {
  return (
    <Box className="h-full flex flex-col items-center justify-center gap-y-6 bg-black">
      <Image
        src="/images/mnky-muzik-app-icon.png"
        alt=""
        width={80}
        height={80}
        className="object-contain animate-pulse"
      />
      <div className="flex flex-col items-center gap-y-1">
        <span className="text-white text-xl font-semibold">MNKY MUZIK</span>
        <span className="text-neutral-400 text-sm">Scents the mood…</span>
      </div>
      <Triangle
        height="80"
        width="80"
        color="#10b981"
        ariaLabel="triangle-loading"
        visible={true}
      />
    </Box>
  );
};

export default Loading;
