"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Spinner,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { LocationResult } from '@/lib/location';

export interface SelectedAddressDetails {
  formattedAddress: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  postcode?: string;
  lat?: number;
  lon?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: SelectedAddressDetails) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  helperText?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing address, colony or landmark in India...',
  required = false,
  label,
  helperText,
  id = 'address-autocomplete',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<SelectedAddressDetails | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Sync external value
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (isSelectingRef.current) return;

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Don't search if the query is already the selected address displayName or locality/name
    if (
      selectedDetails &&
      (query.trim().toLowerCase() === selectedDetails.formattedAddress.trim().toLowerCase() ||
        query.trim().toLowerCase() === selectedDetails.locality.trim().toLowerCase() ||
        query.trim().toLowerCase() === selectedDetails.name.trim().toLowerCase())
    ) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/location/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          // If user already selected while fetch was in flight, do not open
          if (!isSelectingRef.current) {
            setSuggestions(data.results || []);
            setIsOpen((data.results || []).length > 0);
          }
        }
      } catch (err) {
        console.warn('Address autocomplete search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedDetails]);

  const handleSelect = (item: LocationResult) => {
    isSelectingRef.current = true;
    const formatted = item.displayName || `${item.name}, ${item.city}`;
    const details: SelectedAddressDetails = {
      formattedAddress: formatted,
      name: item.name,
      locality: item.locality || item.name,
      city: item.city,
      state: item.state,
      postcode: item.postcode,
      lat: item.lat,
      lon: item.lon,
    };
    setSelectedDetails(details);
    setQuery(formatted);
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
    onChange(formatted, details);
  };

  const handleClear = () => {
    isSelectingRef.current = false;
    setQuery('');
    setSelectedDetails(null);
    onChange('', undefined);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700">{label}</label>
        </div>
      )}

      <div className="relative">
        <MapPin
          size={16}
          weight="fill"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500"
        />

        <input
          id={id}
          type="text"
          required={required}
          value={query}
          onChange={(e) => {
            isSelectingRef.current = false;
            setSelectedDetails(null);
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-16 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading && (
            <Spinner size={15} className="animate-spin text-slate-400" />
          )}

          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear"
            >
              <XCircle size={15} weight="fill" />
            </button>
          )}

          {selectedDetails && (
            <CheckCircle size={15} weight="fill" className="text-emerald-500" />
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          <div className="p-1.5 space-y-1">
            <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
              <span>Location Suggestions</span>
              <a
                href="https://locationiq.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-emerald-700 font-medium normal-case tracking-normal text-[9px] text-slate-400 cursor-pointer"
              >
                Powered by LocationIQ
              </a>
            </div>
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/70 transition-colors flex items-start gap-2.5 cursor-pointer group"
              >
                <MapPin
                  size={16}
                  weight="fill"
                  className="text-slate-400 group-hover:text-emerald-600 mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                    {item.name || item.locality}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.displayName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
