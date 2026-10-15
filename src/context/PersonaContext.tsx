"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GeoCoordinates } from '@/lib/location';
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/actions';

// ─── App UI State Context ─────────────────────────────────────────────────────
// Manages purely UI-level state: active tab, locality, city, coordinates, toast.
// Provides automatic address hydration for registered users and customizable
// manual locality selection for guests.
// ─────────────────────────────────────────────────────────────────────────────

interface LocationState {
  locality: string;
  city: string;
  coords: GeoCoordinates | null;
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLocality: string;
  setActiveLocality: (locality: string) => void;
  activeCity: string;
  setActiveCity: (city: string) => void;
  activeCoords: GeoCoordinates | null;
  setActiveCoords: (coords: GeoCoordinates | null) => void;
  setLocation: (loc: { locality: string; city: string; coords?: GeoCoordinates | null }) => void;
  registeredLocality?: string;
  registeredCity?: string;
  resetToRegisteredAddress: () => boolean;
  detectGPSLocation: () => Promise<boolean>;
  isDetectingGPS: boolean;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  notifications: any[];
  refreshNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toast: string | null;
  showToast: (message: string) => void;
  refreshConfig: () => Promise<void>;
}

const PersonaContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_LOCATION: LocationState = {
  locality: 'All India',
  city: 'All India',
  coords: null,
};

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeLocality, setActiveLocality] = useState<string>(DEFAULT_LOCATION.locality);
  const [activeCity, setActiveCity] = useState<string>(DEFAULT_LOCATION.city);
  const [activeCoords, setActiveCoords] = useState<GeoCoordinates | null>(DEFAULT_LOCATION.coords);
  const [isDetectingGPS, setIsDetectingGPS] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  // 1. Restore saved location preference from localStorage for guest users
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kuc_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.locality) setActiveLocality(parsed.locality);
        if (parsed.city) setActiveCity(parsed.city);
        if (parsed.coords) setActiveCoords(parsed.coords);
      }
    } catch (e) {
      console.warn('Failed to parse saved location from localStorage', e);
    }
  }, []);

  // 2. Hydrate from registered user profile when logged in
  useEffect(() => {
    const userLocality = session?.user?.locality;
    const userCity = session?.user?.city;
    if (userLocality) {
      const saved = localStorage.getItem('kuc_user_location');
      // If user hasn't explicitly set a custom browsing location, default to registered home address
      if (!saved) {
        setActiveLocality(userLocality);
        if (userCity) setActiveCity(userCity);
        if (session.user.lat && session.user.lon) {
          setActiveCoords({ lat: session.user.lat, lon: session.user.lon });
        }
      }
    }
  }, [session]);

  const refreshNotifications = async () => {
    const userIdentifier = session?.user?.email || (session?.user as any)?.id;
    if (!userIdentifier) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getUserNotifications(userIdentifier);
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.warn('Failed to load user notifications:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    const userIdentifier = session?.user?.email || (session?.user as any)?.id;
    if (userIdentifier) {
      await markAllNotificationsAsRead(userIdentifier);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    refreshNotifications();
  }, [session?.user?.email]);

  const refreshConfig = async () => {
    try {
      await fetch('/api/config', { cache: 'no-store' });
    } catch (err) {
      console.warn('Failed to fetch live config:', err);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  const setLocation = (loc: { locality: string; city: string; coords?: GeoCoordinates | null }) => {
    setActiveLocality(loc.locality);
    setActiveCity(loc.city);
    if (loc.coords !== undefined) {
      setActiveCoords(loc.coords);
    }
    try {
      localStorage.setItem(
        'kuc_user_location',
        JSON.stringify({
          locality: loc.locality,
          city: loc.city,
          coords: loc.coords !== undefined ? loc.coords : activeCoords,
        })
      );
    } catch (e) {
      console.warn('Could not save location to localStorage', e);
    }
  };

  const resetToRegisteredAddress = (): boolean => {
    if (session?.user?.locality) {
      const loc = {
        locality: session.user.locality,
        city: session.user.city || 'Agra',
        coords: session.user.lat && session.user.lon ? { lat: session.user.lat, lon: session.user.lon } : null,
      };
      setLocation(loc);
      showToast(`📍 Set to registered address: ${loc.locality}, ${loc.city}`);
      return true;
    }
    return false;
  };

  const detectGPSLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('⚠️ Geolocation is not supported by your browser');
      return false;
    }
    setIsDetectingGPS(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`/api/location/reverse?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data.result) {
                const loc = data.result;
                const city =
                  loc.city && loc.city.toLowerCase() !== 'india'
                    ? loc.city
                    : (loc.state || 'Delhi NCR');
                const locality = loc.locality || loc.name || city;
                setLocation({
                  locality,
                  city,
                  coords: { lat: latitude, lon: longitude },
                });
                showToast(`📍 Location set: ${locality}, ${city}`);
                try {
                  sessionStorage.setItem('kuc_location_dismissed', 'true');
                } catch (e) {}
                resolve(true);
                return;
              }
            }
            setLocation({
              locality: 'Nearby',
              city: 'Current Location',
              coords: { lat: latitude, lon: longitude },
            });
            showToast('📍 Location detected via GPS');
            try {
              sessionStorage.setItem('kuc_location_dismissed', 'true');
            } catch (e) {}
            resolve(true);
          } catch (e) {
            console.warn('GPS reverse lookup failed:', e);
            showToast('⚠️ Could not resolve address from GPS');
            resolve(false);
          } finally {
            setIsDetectingGPS(false);
          }
        },
        (err) => {
          setIsDetectingGPS(false);
          if (err.code === err.PERMISSION_DENIED) {
            showToast('📍 GPS permission denied. Please pick your city.');
          } else {
            showToast('📍 Could not acquire GPS coordinates.');
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  return (
    <PersonaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeLocality,
        setActiveLocality,
        activeCity,
        setActiveCity,
        activeCoords,
        setActiveCoords,
        setLocation,
        registeredLocality: session?.user?.locality,
        registeredCity: session?.user?.city,
        resetToRegisteredAddress,
        detectGPSLocation,
        isDetectingGPS,
        unreadCount,
        setUnreadCount,
        notifications,
        refreshNotifications,
        markAllNotificationsRead,
        toast,
        showToast,
        refreshConfig,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
