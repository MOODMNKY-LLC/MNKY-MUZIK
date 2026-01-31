'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Use native img for internal Navidrome cover URLs to avoid next/image hydration mismatch (relative vs absolute src). */
function isNavidromeCover(src: string): boolean {
  return typeof src === 'string' && src.startsWith('/api/navidrome/cover');
}

/** External URLs (http/https) - use native img to avoid next/image hostname config issues across CDNs. */
function isExternalUrl(src: string): boolean {
  return typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));
}

export interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
}

/**
 * Renders cover art: native <img> for Navidrome, external URLs (http/https),
 * next/image only for local paths (e.g. /images/).
 */
export function CoverImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  loading,
  unoptimized = false,
}: CoverImageProps) {
  if (isNavidromeCover(src) || isExternalUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(fill && 'absolute inset-0 h-full w-full', 'object-cover', className)}
        loading={loading}
        sizes={sizes}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      fill={fill}
      sizes={sizes}
      loading={loading}
      unoptimized={unoptimized}
    />
  );
}
