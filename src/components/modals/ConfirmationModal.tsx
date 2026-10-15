"use client";

import React, { useEffect } from 'react';
import { Warning, Trash, X, Spinner } from '@phosphor-icons/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  itemName,
  message,
  confirmText = "Delete Permanently",
  cancelText = "Cancel",
  isPending = false,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            <Warning size={26} weight="fill" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {title}
            </h3>
            {itemName && (
              <div className="mt-1 inline-block bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 truncate max-w-full">
                {itemName}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-extrabold text-xs hover:bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
            }`}
          >
            {isPending ? (
              <>
                <Spinner size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Trash size={14} weight="bold" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
