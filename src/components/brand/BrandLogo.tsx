"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showTagline?: boolean;
  iconOnly?: boolean;
  clickable?: boolean;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  variant = 'light',
  showTagline = true,
  iconOnly = false,
  clickable = true,
  className = '',
}: BrandLogoProps) {
  // Dimensions per size - optimized for the new KnowUrCoach logo (3.83:1 aspect ratio)
  const heightClasses = {
    sm: iconOnly ? 'h-8 w-8' : 'h-8 sm:h-9',
    md: iconOnly ? 'h-10 w-10' : 'h-10 sm:h-11 lg:h-12',
    lg: iconOnly ? 'h-14 w-14' : 'h-13 sm:h-15',
    xl: iconOnly ? 'h-20 w-20' : 'h-18 sm:h-22',
  }[size];

  const isDark = variant === 'dark';
  const logoSrc = iconOnly
    ? '/images/brand/logo-icon.png'
    : isDark
      ? '/images/brand/logo-dark-mode.png'
      : '/images/brand/logo-full.png';

  const content = (
    <div className={`inline-flex items-center group select-none ${className}`}>
      <div className="relative flex items-center transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src={logoSrc}
          alt="KnowUrCoach - Unlock Growth"
          width={iconOnly ? 80 : 383}
          height={iconOnly ? 80 : 100}
          className={`${heightClasses} w-auto object-contain`}
          unoptimized
          priority
        />
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link
        href="/"
        className="inline-flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
