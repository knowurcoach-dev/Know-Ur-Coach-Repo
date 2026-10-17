"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  WarningCircle,
  ArrowsClockwise,
  House,
  CloudSlash,
} from '@phosphor-icons/react';

interface DatabaseErrorViewProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void | Promise<void>;
  showHomeButton?: boolean;
  compact?: boolean;
}

/**
 * Checks whether a message looks like a raw technical/database error string
 * that shouldn't be exposed directly to end-users.
 */
function isTechnicalString(str?: string | null): boolean {
  if (!str) return false;
  return /database|postgres|prisma|sql|zero-mock|server error|internal error|failed to fetch/i.test(str);
}

export function DatabaseErrorView({
  title = 'Unable to Load Content',
  message,
  error,
  onRetry,
  showHomeButton = true,
  compact = false,
}: DatabaseErrorViewProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (e) {
      console.error('[SERVICE_ERROR_RETRY] Failed:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  const rawError =
    typeof error === 'string'
      ? error
      : error?.message || (error ? String(error) : null);

  // If the passed message is technical, sanitize it into consumer-friendly text
  const displayTitle = isTechnicalString(title) ? 'Unable to Load Content' : title;
  const displayMessage =
    !message || isTechnicalString(message)
      ? 'We are having trouble loading this information right now. Please check your internet connection or try again in a few moments.'
      : message;

  // Technical diagnostic detail for developers/admins
  const diagnosticDetail = isTechnicalString(message) ? message : rawError;

  if (compact) {
    return (
      <div className="w-full bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-slate-800 shadow-sm backdrop-blur-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
            <CloudSlash size={20} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">{displayTitle}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{displayMessage}</p>
            {onRetry && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <ArrowsClockwise
                    size={14}
                    weight="bold"
                    className={isRetrying ? 'animate-spin' : ''}
                  />
                  {isRetrying ? 'Trying again...' : 'Try Again'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-10">
        {/* Ambient subtle backdrop */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Friendly Illustration Badge */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <CloudSlash size={38} weight="duotone" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold tracking-wide mb-3 border border-amber-200/60">
            <WarningCircle size={14} weight="bold" />
            Connection Notice
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {displayTitle}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-md leading-relaxed">
            {displayMessage}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <ArrowsClockwise
                  size={16}
                  weight="bold"
                  className={isRetrying ? 'animate-spin' : ''}
                />
                {isRetrying ? 'Trying again...' : 'Try Again'}
              </button>
            )}

            {showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <House size={16} weight="bold" />
                Return to Home
              </Link>
            )}
          </div>

          {/* Collapsible Diagnostics (subtle and collapsed by default) */}
          {diagnosticDetail && (
            <div className="w-full mt-8 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
              </button>
              {showDetails && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] text-left overflow-x-auto max-w-full">
                  <span className="text-slate-500 select-none">[DIAGNOSTIC]: </span>
                  {diagnosticDetail}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
