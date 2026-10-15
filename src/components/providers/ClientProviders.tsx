"use client";

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { PersonaProvider } from '@/context/PersonaContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <PersonaProvider>
        {children}
      </PersonaProvider>
    </SessionProvider>
  );
}
