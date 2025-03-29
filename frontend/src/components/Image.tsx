'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const OptimizedImage = ({ src, alt, width = 800, height = 600, className }: ImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`duration-700 ease-in-out ${
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        priority
        quality={90}
      />
    </div>
  );
}; 