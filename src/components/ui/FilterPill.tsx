"use client";

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  colorScheme?: 'blue' | 'dark' | 'emerald' | 'orange';
  size?: 'xs' | 'sm';
}

export function FilterPill({
  children,
  className,
  active = false,
  colorScheme = 'blue',
  size = 'sm',
  ...props
}: FilterPillProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-bold transition-all flex-shrink-0 cursor-pointer select-none';

  const sizeClasses = {
    xs: 'text-[9px] px-2.5 py-1',
    sm: 'text-[10px] md:text-xs px-3 py-1.5',
  };

  const activeColorClasses = {
    blue: 'bg-blue-600 text-white shadow-xs',
    dark: 'bg-[#0a1128] text-white shadow-sm',
    emerald: 'bg-emerald-600 text-white shadow-xs',
    orange: 'bg-orange-600 text-white shadow-xs',
  };

  const inactiveClasses = 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100';

  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          baseClasses,
          sizeClasses[size],
          active ? activeColorClasses[colorScheme] : inactiveClasses,
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
}
