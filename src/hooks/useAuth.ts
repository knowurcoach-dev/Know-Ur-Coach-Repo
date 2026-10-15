"use client";

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const isGuest = !isAuthenticated;

  const role = (session?.user as any)?.role || 'GUEST';
  const isParent = role === 'PARENT';
  const isCoach = role === 'COACH';
  const isAdmin = role === 'ADMIN';

  return {
    session,
    status,
    user: session?.user,
    role,
    isLoading,
    isAuthenticated,
    isGuest,
    isParent,
    isCoach,
    isAdmin,
  };
}
