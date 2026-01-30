'use client';

import { Box } from '@/components/Box';
import { Triangle } from '@/components/TriangleLoader';

const Loading = () => {
  return (
    <Box className="h-full flex items-center justify-center">
      <Triangle
        height="80"
        width="80"
        color="#1DB954"
        ariaLabel="triangle-loading"
        visible={true}
      />
    </Box>
  );
};

export default Loading;
