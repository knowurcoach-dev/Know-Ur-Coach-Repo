"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import {
  MapPin,
  MagnifyingGlass,
  Spinner,
  Buildings,
  CheckCircle,
  Sparkle,
  User,
  ArrowRight,
  Check,
  Compass,
  NavigationArrow,
  GlobeHemisphereWest,
  X,
} from '@phosphor-icons/react';
import { DialogWrapper } from './DialogWrapper';
import { TOP_INDIAN_CITIES, TopCityItem, LocationResult } from '@/lib/location';
import { sortConfiguredCities } from '@/lib/location-config';

interface LocalityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingSelection {
  selectedId?: string;
  locality: string;
  city: string;
  coords?: { lat: number; lon: number } | null;
  displayName?: string;
}

export function LocalityModal({ isOpen, onClose }: LocalityModalProps) {
  const {
    activeLocality,
    activeCity,
    activeCoords,
    setLocation,
    resetToRegisteredAddress,
    detectGPSLocation,
    isDetectingGPS,
    showToast,
    locationConfig,
  } = usePersona();

  const { isAuthenticated, user, session } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const selectedAddressQueryRef = useRef<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      selectedAddressQueryRef.current = null;
    }
  }, [isOpen]);

  // Debounced live search via LocationIQ geocoding service
  useEffect(() => {
    if (
      selectedAddressQueryRef.current &&
      searchQuery.trim().toLowerCase() === selectedAddressQueryRef.current.trim().toLowerCase()
    ) {
      return;
    }
    selectedAddressQueryRef.current = null;

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/location/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute sorted cities unconditionally (must run on every render before any returns)
  const citiesList = useMemo(() => {
    if (locationConfig?.cities && locationConfig.cities.length > 0) {
      const active = locationConfig.cities.filter((c) => c.isActive);
      return sortConfiguredCities(active, locationConfig.sortMode || 'manual');
    }
    return TOP_INDIAN_CITIES;
  }, [locationConfig]);

  const commitLocation = (selection: PendingSelection) => {
    if (!selection.locality.trim() && !selection.city.trim()) return;

    setLocation({
      locality: selection.locality || selection.city,
      city: selection.city,
      coords: selection.coords,
    });
    setSearchResults([]);
    setIsSearching(false);
    showToast(`📍 Location set to ${selection.locality === selection.city ? selection.city : `${selection.locality}, ${selection.city}`}`);
    try {
      sessionStorage.setItem('kuc_location_dismissed', 'true');
    } catch (e) {}
    onClose();
  };

  const handleSelectCityCard = (cityItem: TopCityItem) => {
    commitLocation({
      locality: cityItem.city,
      city: cityItem.city,
      coords: { lat: cityItem.lat, lon: cityItem.lon },
      displayName: `${cityItem.city}, ${cityItem.state}`,
    });
  };

  const handleSelectAllIndia = () => {
    commitLocation({
      locality: 'All India',
      city: 'All India',
      coords: null,
      displayName: 'All India (Browse Everywhere)',
    });
  };

  const handleSelectResult = (item: LocationResult) => {
    const locality = item.locality || item.name;
    const city =
      item.city && item.city.toLowerCase() !== 'india'
        ? item.city
        : (item.state || 'Delhi NCR');

    commitLocation({
      selectedId: item.id,
      locality,
      city,
      coords: { lat: item.lat, lon: item.lon },
      displayName: item.displayName || `${locality}, ${city}`,
    });
  };

  const handleApplyCustomQuery = () => {
    if (!searchQuery.trim()) return;
    const queryText = searchQuery.trim();
    const matchedCity = TOP_INDIAN_CITIES.find(
      (c) =>
        c.city.toLowerCase() === queryText.toLowerCase() ||
        queryText.toLowerCase().includes(c.city.toLowerCase())
    );

    const city = matchedCity?.city || activeCity || 'Delhi NCR';
    const locality =
      matchedCity && matchedCity.city.toLowerCase() === queryText.toLowerCase()
        ? matchedCity.city
        : queryText;

    commitLocation({
      selectedId: `custom-${Date.now()}`,
      locality,
      city,
      coords: matchedCity ? { lat: matchedCity.lat, lon: matchedCity.lon } : null,
      displayName: `${locality}, ${city}`,
    });
  };

  const handleGPSDetect = async () => {
    const success = await detectGPSLocation();
    if (success) {
      try {
        sessionStorage.setItem('kuc_location_dismissed', 'true');
      } catch (e) {}
      onClose();
    }
  };

  const registeredLocality = (session?.user as any)?.locality;
  const registeredCity = (session?.user as any)?.city;
  const hasRegisteredAddress = Boolean(registeredLocality || registeredCity);

  const showGps = locationConfig?.showGpsButton ?? true;
  const showAllIndia = locationConfig?.showAllIndiaButton ?? true;
  const isAllIndiaActive = activeCity.toLowerCase().includes('india') || activeCity.toLowerCase() === 'all';

  if (!isOpen) return null;

  return (
    <DialogWrapper
      id="locality-selector-modal"
      isOpen={isOpen}
      onClose={onClose}
      desktopWidth="md:max-w-2xl"
      icon={<Compass size={22} weight="fill" className="text-emerald-600" />}
      title={locationConfig?.modalTitle || "Choose Your Location"}
      subtitle={locationConfig?.modalSubtitle || "Discover verified sports academies, coaches & creative labs across India"}
      headerGradient="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50"
      hideCloseButton={locationConfig ? !locationConfig.isDismissible : false}
    >
      <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
        {/* User Account Registered Address Banner (if authenticated) */}
        {isAuthenticated && hasRegisteredAddress && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <User size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  Signed in as {user?.name || 'Parent Member'}
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  Saved Home: <span className="font-semibold text-emerald-800">{registeredLocality || activeLocality}, {registeredCity || activeCity}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetToRegisteredAddress();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shrink-0 shadow-xs cursor-pointer transition-colors active:scale-95"
            >
              Use Home
            </button>
          </div>
        )}

        {/* 1-Tap Quick Action Row: GPS Auto-Detect & Pan-India Explore */}
        {(showGps || showAllIndia) && (
          <div className={`grid gap-2.5 ${showGps && showAllIndia ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Action 1: Use Current Location (GPS) */}
            {showGps && (
              <button
                type="button"
                id="gps-location-btn"
                onClick={handleGPSDetect}
                disabled={isDetectingGPS}
                className="p-3.5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white hover:from-emerald-100/90 hover:via-teal-100/60 hover:to-emerald-50 text-left transition-all cursor-pointer shadow-xs group flex items-center justify-between gap-3 disabled:opacity-75"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {isDetectingGPS ? (
                      <Spinner size={20} weight="bold" className="animate-spin" />
                    ) : (
                      <NavigationArrow size={20} weight="fill" className="text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{locationConfig?.gpsButtonLabel || 'Use Current Location'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {isDetectingGPS ? 'Detecting device GPS...' : 'Auto-detect via GPS for nearby academies'}
                    </div>
                  </div>
                </div>
                <ArrowRight size={15} weight="bold" className="text-emerald-700 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Action 2: Explore All India (Pan-India) */}
            {showAllIndia && (
              <button
                type="button"
                id="pan-india-location-btn"
                onClick={handleSelectAllIndia}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs group flex items-center justify-between gap-3 ${
                  isAllIndiaActive
                    ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20'
                    : 'border-blue-300/80 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white hover:from-blue-100/80 hover:via-indigo-100/50 hover:to-blue-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <GlobeHemisphereWest size={20} weight="fill" className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{locationConfig?.allIndiaButtonLabel || 'Explore All India'}</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">
                        Pan-India
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      Browse top academies &amp; tournaments nationwide
                    </div>
                  </div>
                </div>
                {isAllIndiaActive ? (
                  <CheckCircle size={18} weight="fill" className="text-blue-600 shrink-0" />
                ) : (
                  <ArrowRight size={15} weight="bold" className="text-blue-700 shrink-0 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Live Search Bar for any Indian city, area, colony, or PIN code */}
        <div className="space-y-2">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              id="location-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchResults.length > 0) {
                    handleSelectResult(searchResults[0]);
                  } else {
                    handleApplyCustomQuery();
                  }
                }
              }}
              placeholder={locationConfig?.searchPlaceholder || "Search city, area, neighbourhood or 6-digit PIN code (e.g. 110001, Indiranagar)..."}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
            {isSearching ? (
              <Spinner
                size={18}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Tip: Type any Indian colony or PIN code for instant auto-suggest</span>
            <span className="font-semibold text-slate-500">Live Indian Map Resolution</span>
          </div>

          {/* Search Results Dropdown List */}
          {searchQuery.trim().length >= 2 && (
            <div className="space-y-1 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl max-h-60 overflow-y-auto animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Sparkle size={12} weight="fill" className="text-emerald-500" />
                  Map Suggestions ({searchResults.length})
                </span>
                <span className="text-[9px] text-slate-400">Powered by LocationIQ</span>
              </div>

              {searchResults.length === 0 && !isSearching && (
                <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                  <p>No exact map match found for &quot;{searchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={handleApplyCustomQuery}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Explore as &quot;{searchQuery.trim()}&quot;</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              )}

              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectResult(item)}
                  className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <MapPin
                      size={18}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-slate-400 group-hover:text-emerald-600 transition-colors"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-950">
                        {item.name || item.locality}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.displayName}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs opacity-90 group-hover:opacity-100 shrink-0">
                    Select
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Indian Cities Grid — 1-Click Fast Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Buildings size={16} weight="fill" className="text-emerald-600" />
              Popular Coaching Hubs
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              1-Click Instant Select
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {citiesList.map((cityItem: any) => {
              const isSelected =
                !isAllIndiaActive &&
                activeCity.toLowerCase() === cityItem.city.toLowerCase();

              return (
                <button
                  key={cityItem.city}
                  type="button"
                  id={`city-btn-${cityItem.city.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleSelectCityCard(cityItem)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/80 shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="text-lg leading-none" role="img" aria-label={cityItem.city}>
                      {cityItem.icon || '📍'}
                    </span>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check size={11} weight="bold" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 transition-colors">
                        Select
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-emerald-950 transition-colors truncate">
                      {cityItem.city}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-medium">
                      {cityItem.tag || cityItem.state}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Status Footer */}
        <div className="pt-3 border-t border-slate-200 bg-slate-50/80 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Currently Exploring
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  {activeLocality && activeLocality.toLowerCase() !== activeCity.toLowerCase()
                    ? `${activeLocality}, ${activeCity}`
                    : activeCity}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer shadow-2xs active:scale-95"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60">
            <span>Pan-India verified sports &amp; coaching directory</span>
            <a
              href="https://locationiq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-slate-600 cursor-pointer"
            >
              Powered by LocationIQ / © OSM contributors
            </a>
          </div>
        </div>
      </div>
    </DialogWrapper>
  );
}
