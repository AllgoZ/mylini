'use client';

import { useEffect, useRef, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

// Generic warm-neutral shimmer placeholder (matches --color-border-soft) — inline data URI,
// no extra network request, so this stays consistent with "no duplicated downloads".
const SHIMMER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="#EADAD2"/></svg>';
const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(SHIMMER_SVG)}`;

interface FadeImageProps extends ImageProps {
  /**
   * Set to false when the caller already drives this image's opacity itself (e.g. a
   * hover crossfade between stacked images, like ProductCard's carousel). The blur
   * placeholder still applies; only the load-triggered fade is skipped so it doesn't
   * fight the caller's own opacity classes.
   */
  fadeIn?: boolean;
}

// Drop-in replacement for next/image's <Image> that adds a blur placeholder and a
// fade-in-on-load transition, so images never pop in abruptly.
export function FadeImage({ className, alt, onLoad, fadeIn = true, ...props }: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cached images can already be `complete` before onLoad attaches (e.g. navigating
  // back to a page) — check on mount too, so the image never gets stuck invisible.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <Image
      {...props}
      alt={alt}
      ref={imgRef}
      placeholder={props.placeholder ?? 'blur'}
      blurDataURL={props.blurDataURL ?? SHIMMER_BLUR_DATA_URL}
      className={
        fadeIn
          ? cn(className, 'transition-opacity duration-300 ease-out', loaded ? 'opacity-100' : 'opacity-0')
          : className
      }
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
