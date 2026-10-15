"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getSavedCentreIds, toggleCentreBookmark } from '@/lib/actions';

const STORAGE_KEY = 'kuc_saved_academies';
const BOOKMARK_EVENT = 'kuc_bookmarks_updated';

function getStoredBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse saved academies from localStorage:', err);
    return [];
  }
}

function setStoredBookmarks(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Failed to save academies to localStorage:', err);
  }
}

export function useBookmarks() {
  const { session, user, isGuest, isAuthenticated, status } = useAuth();
  const { showToast } = usePersona();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const userEmail = session?.user?.email || (user as any)?.email;

  // Load bookmarks depending on authentication status
  const loadBookmarks = useCallback(async () => {
    // If still resolving session, hold loading
    if (status === 'loading') return;

    if (isGuest || !userEmail) {
      // Guest: strictly load from localStorage (default [] for new guests)
      const localIds = getStoredBookmarks();
      setSavedIds(localIds);
      setIsLoading(false);
    } else {
      // Authenticated parent: load from database
      try {
        const dbIds = await getSavedCentreIds(userEmail);
        setSavedIds(dbIds);
        // Also mirror to localStorage for quick offline/fallback access
        setStoredBookmarks(dbIds);
      } catch (err) {
        console.warn('Could not load bookmarks from DB, falling back to local:', err);
        const localIds = getStoredBookmarks();
        setSavedIds(localIds);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isGuest, userEmail, status]);

  // Initial load and on user change
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Listen to cross-component sync event
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ savedIds: string[] }>;
      if (customEvent.detail && Array.isArray(customEvent.detail.savedIds)) {
        setSavedIds(customEvent.detail.savedIds);
      } else {
        loadBookmarks();
      }
    };

    window.addEventListener(BOOKMARK_EVENT, handleSync);
    return () => {
      window.removeEventListener(BOOKMARK_EVENT, handleSync);
    };
  }, [loadBookmarks]);

  const isSaved = useCallback(
    (centreId: string) => {
      return savedIds.includes(centreId);
    },
    [savedIds]
  );

  const toggleBookmark = useCallback(
    async (centreId: string, centreName?: string): Promise<boolean> => {
      if (!centreId) return false;

      const currentlySaved = savedIds.includes(centreId);
      const nextSaved = !currentlySaved;

      // 1. Optimistic update in state
      const nextIds = nextSaved
        ? [...savedIds, centreId]
        : savedIds.filter((id) => id !== centreId);

      setSavedIds(nextIds);
      setStoredBookmarks(nextIds);

      // Dispatch event for other components on page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(BOOKMARK_EVENT, { detail: { savedIds: nextIds } })
        );
      }

      // 2. Feedback toast
      const displayName = centreName || 'Academy';
      showToast(
        nextSaved
          ? `❤️ Saved ${displayName} to your shortlist`
          : `Removed ${displayName} from shortlist`
      );

      // 3. For authenticated users, sync with backend database
      if (isAuthenticated && userEmail) {
        try {
          const res = await toggleCentreBookmark(userEmail, centreId);
          if (!res.success) {
            throw new Error(res.message || 'Server bookmark update failed');
          }
          return nextSaved;
        } catch (err) {
          console.warn('Backend bookmark sync error, reverting optimistic update:', err);
          // Revert optimistic update
          setSavedIds(savedIds);
          setStoredBookmarks(savedIds);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent(BOOKMARK_EVENT, { detail: { savedIds } })
            );
          }
          showToast('⚠️ Could not update bookmark on server. Please try again.');
          return currentlySaved;
        }
      }

      return nextSaved;
    },
    [savedIds, isAuthenticated, userEmail, showToast]
  );

  return {
    savedIds,
    isSaved,
    toggleBookmark,
    isLoading,
    refreshBookmarks: loadBookmarks,
  };
}
