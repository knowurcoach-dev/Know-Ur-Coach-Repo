"use client";

import React from 'react';
import { usePersona } from '@/context/PersonaContext';
import { Info } from '@phosphor-icons/react';

export function Toast() {
  const { toast } = usePersona();

  if (!toast) return null;

  return (
    <div
      id="toast"
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0a1128]/95 backdrop-blur-md text-white text-xs font-bold px-5 py-3.5 rounded-2xl shadow-2xl z-[9999] flex items-center gap-2.5 w-max max-w-[90%] animate-fade-in border border-white/10 pointer-events-auto"
    >
      <Info size={18} weight="fill" className="text-blue-400 flex-shrink-0" />
      <span id="toast-message" className="leading-snug">{toast}</span>
    </div>
  );
}
