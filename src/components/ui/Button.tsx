"use client";

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'glass';
  color?: 'blue' | 'emerald' | 'orange' | 'dark' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'solid',
  color = 'blue',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  // Base classes with micro-interactions matching prototype
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  // Size variants
  const sizeClasses = {
    sm: 'text-[10px] px-2.5 py-1.5',
    md: 'text-xs px-3.5 py-2.5',
    lg: 'text-sm px-5 py-3.5',
  };

  // Color & Variant matrix matching prototype exactly
  const solidColors = {
    blue: 'bg-[#0066ff] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20',
    dark: 'bg-[#0a1128] hover:bg-slate-900 text-white shadow-md',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
    red: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  };

  const outlineColors = {
    blue: 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50',
    emerald: 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    orange: 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50',
    dark: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    purple: 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50',
    red: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50',
  };

  const ghostColors = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    dark: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    red: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  };

  const glassClasses = 'backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border border-white/25 shadow-xs';

  let variantClass = solidColors[color];
  if (variant === 'outline') variantClass = outlineColors[color];
  else if (variant === 'ghost') variantClass = ghostColors[color];
  else if (variant === 'glass') variantClass = glassClasses;

  return (
    <button
      className={twMerge(
        clsx(
          baseClasses,
          sizeClasses[size],
          variantClass,
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
}
