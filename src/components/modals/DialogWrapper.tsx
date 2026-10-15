"use client";

import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

interface DialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerGradient?: string;
  headerRight?: React.ReactNode;
  className?: string;
  id?: string;
  /** Max width for desktop centered dialog. Defaults to 'md:max-w-lg' */
  desktopWidth?: string;
}

export function DialogWrapper({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  headerGradient,
  headerRight,
  className = '',
  id,
  desktopWidth = 'md:max-w-lg',
}: DialogWrapperProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasHeader = Boolean(title || icon || headerRight);

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center backdrop-blur-sm bg-black/40 animate-fade-in"
    >
      <div
        className={`w-full max-h-[90vh] rounded-t-[1.75rem] animate-sheet-up md:rounded-3xl md:shadow-2xl md:animate-none ${desktopWidth} bg-white flex flex-col overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden sheet-drag-handle cursor-grab active:cursor-grabbing" />

        {/* Optional Header */}
        {hasHeader && (
          <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 ${headerGradient || 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="font-extrabold text-[#0a1128] text-sm leading-tight">{title}</h3>
                ) : title}
                {subtitle && (
                  typeof subtitle === 'string'
                    ? <p className="text-[10px] text-gray-500 font-medium">{subtitle}</p>
                    : subtitle
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              <button type="button" onClick={onClose} aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer">
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
