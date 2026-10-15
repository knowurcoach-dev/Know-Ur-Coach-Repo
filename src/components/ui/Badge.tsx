import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'emerald' | 'blue' | 'orange' | 'purple' | 'yellow' | 'red' | 'gray';
  hasDot?: boolean;
  pulse?: boolean;
  size?: 'xs' | 'sm';
}

export function Badge({
  children,
  className,
  color = 'blue',
  hasDot = false,
  pulse = false,
  size = 'xs',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1 font-extrabold uppercase rounded-full tracking-wide';

  const sizeClasses = {
    xs: 'text-[9px] px-2 py-0.5',
    sm: 'text-[10px] px-2.5 py-1',
  };

  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-400 text-gray-900',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-800',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <span
      className={twMerge(
        clsx(baseClasses, sizeClasses[size], colorClasses[color], className)
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full inline-block flex-shrink-0',
            dotColors[color],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}
