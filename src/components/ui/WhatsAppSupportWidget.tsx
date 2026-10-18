"use client";

import React, { useState, useEffect } from 'react';
import { WhatsappLogo, X } from '@phosphor-icons/react';

export const SUPPORT_WHATSAPP_NUMBER = '919762577714';
export const SUPPORT_WHATSAPP_URL =
  'https://wa.me/919762577714?text=Hi%20KnowUrCoach%20Team%2C%20I%20need%20support%20assistance';
export const PROMPT_AUTO_DISMISS_DELAY_MS = 2500;

export function WhatsAppSupportWidget() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt bubble in this session
    try {
      const dismissed = sessionStorage.getItem('kuc_wa_prompt_dismissed');
      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    // Show friendly speech prompt after a brief 2s delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Automatically make popover disappear after 2-3 seconds (2500ms)
  useEffect(() => {
    if (!showPrompt) return;

    const autoDismissTimer = setTimeout(() => {
      setShowPrompt(false);
    }, PROMPT_AUTO_DISMISS_DELAY_MS);

    return () => clearTimeout(autoDismissTimer);
  }, [showPrompt]);

  const handleDismissPrompt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPrompt(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('kuc_wa_prompt_dismissed', 'true');
    } catch (err) {
      // Ignore
    }
  };

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed z-40 right-4 sm:right-6 bottom-20 md:bottom-6 flex flex-col items-end pointer-events-none select-none"
    >
      {/* Friendly Speech Bubble / Tooltip (Desktop & Mobile) */}
      {showPrompt && !isDismissed && (
        <div className="mb-2 mr-0.5 sm:mr-1 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative bg-white text-slate-900 border border-slate-200/90 rounded-2xl shadow-xl px-3.5 py-2 sm:py-2.5 max-w-[210px] sm:max-w-[240px] text-left">
            <button
              onClick={handleDismissPrompt}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border border-slate-200 text-[10px] transition-colors cursor-pointer shadow-2xs"
              aria-label="Dismiss support prompt"
              title="Close"
            >
              <X size={10} weight="bold" />
            </button>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                Support Online
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-snug">
              Need help finding a coach or booking a pass?{' '}
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-black hover:underline inline-flex items-center gap-0.5"
              >
                Chat on WhatsApp &rarr;
              </a>
            </p>
            {/* Small arrow pointing down */}
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-r border-b border-slate-200/90 transform rotate-45" />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with KnowUrCoach Support on WhatsApp"
        id="floating-whatsapp-btn"
        onMouseEnter={() => {
          if (!isDismissed) setShowPrompt(true);
        }}
        className="pointer-events-auto group relative flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white p-3.5 sm:p-3.5 md:px-4 md:py-3 rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 border border-white/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/15 hover:ring-emerald-500/30"
      >
        {/* Pulsing online badge indicator */}
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-0.5 -mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-100 border-2 border-white" />
        </span>

        {/* WhatsApp Icon */}
        <WhatsappLogo size={24} weight="fill" className="shrink-0 drop-shadow-xs" />

        {/* Desktop Expandable Text Label */}
        <div className="hidden md:flex flex-col text-left leading-tight pr-1">
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider leading-none">
            Helpdesk
          </span>
          <span className="text-xs font-black text-white leading-tight">
            WhatsApp Support
          </span>
        </div>
      </a>
    </aside>
  );
}
