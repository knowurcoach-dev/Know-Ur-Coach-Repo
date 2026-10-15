"use client";

import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

interface BottomSheetWrapperProps {
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
}

export function BottomSheetWrapper({
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
}: BottomSheetWrapperProps) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
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
      onClick={(e) => {
        // Dismiss only when clicking directly on the glassmorphism backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="absolute inset-0 z-[150] flex items-end justify-center backdrop-blur-sm bg-black/30 bg-[#0a1128]/50 animate-fade-in transition-all"
    >
      <div
        className={`bottom-sheet-content w-full max-h-[88%] bg-white rounded-t-[1.75rem] shadow-2xl flex flex-col overflow-hidden animate-sheet-up pointer-events-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sheet-drag-handle cursor-grab active:cursor-grabbing" />

        {/* Optional Header */}
        {hasHeader && (
          <div
            className={`px-5 py-3.5 border-b border-gray-100 flex items-center justify-between ${
              headerGradient || 'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-lg shadow-xs flex-shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {typeof title === 'string' ? (
                  <h3 className="font-extrabold text-[#0a1128] text-sm leading-tight">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  typeof subtitle === 'string' ? (
                    <p className="text-[10px] text-gray-500 font-medium">
                      {subtitle}
                    </p>
                  ) : (
                    subtitle
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {headerRight}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center border border-gray-200 shadow-2xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
