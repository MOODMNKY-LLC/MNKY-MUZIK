'use client';

import type React from 'react';

// react-loader-spinner 5.x types only declare default exports; Triangle is a named export at runtime
const Triangle = (
  require('react-loader-spinner') as {
    Triangle: React.ComponentType<{
      height?: string;
      width?: string;
      color?: string;
      ariaLabel?: string;
      visible?: boolean;
    }>;
  }
).Triangle;

export { Triangle };
