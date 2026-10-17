"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  TaxonomyGroup,
  getCategoryEmoji,
  getCategoryDisplayName,
} from '@/lib/categories';
import {
  CaretDown,
  Check,
  X,
  Plus,
  Trash,
  Tag,
  Sparkle,
} from '@phosphor-icons/react';

interface MultiCategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  taxonomy?: TaxonomyGroup[];
  theme?: 'blue' | 'emerald';
  minRequired?: number;
  label?: string;
  sublabel?: string;
}

export function MultiCategorySelector({
  selectedCategories,
  onChange,
  taxonomy = [],
  theme = 'blue',
  minRequired = 1,
  label = 'Activities & Categories Offered',
  sublabel = 'Select your academy coaching programs. Switch the main activity dropdown to add categories across multiple disciplines.',
}: MultiCategorySelectorProps) {
  const groups = taxonomy || [];

  // Active Main Activity selected in Dropdown 1
  const [activeMainSlug, setActiveMainSlug] = useState<string>(groups[0]?.slug || 'sports');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure activeMainSlug points to a valid group
  useEffect(() => {
    if (!groups.some((g) => g.slug === activeMainSlug) && groups.length > 0) {
      setActiveMainSlug(groups[0].slug);
    }
  }, [groups, activeMainSlug]);

  const activeGroup = groups.find((g) => g.slug === activeMainSlug) || groups[0];
  const activeGroupCategories = activeGroup?.categories || [];

  // Count how many categories in the current active group are selected
  const selectedInActiveGroup = activeGroupCategories.filter((c) =>
    selectedCategories.includes(c.slug)
  );

  // Toggle single category
  const handleToggle = (catSlug: string) => {
    if (selectedCategories.includes(catSlug)) {
      if (selectedCategories.length <= minRequired) {
        return;
      }
      onChange(selectedCategories.filter((c) => c !== catSlug));
    } else {
      onChange([...selectedCategories, catSlug]);
    }
  };

  // Remove single category directly from pill
  const handleRemove = (catSlug: string) => {
    if (selectedCategories.length <= minRequired) {
      return;
    }
    onChange(selectedCategories.filter((c) => c !== catSlug));
  };

  // Select all categories in the active group
  const handleSelectAllInGroup = () => {
    const toAdd = activeGroupCategories
      .map((c) => c.slug)
      .filter((slug) => !selectedCategories.includes(slug));
    if (toAdd.length > 0) {
      onChange([...selectedCategories, ...toAdd]);
    }
  };

  // Deselect all categories in the active group
  const handleClearInGroup = () => {
    const slugsInGroup = new Set(activeGroupCategories.map((c) => c.slug));
    const remaining = selectedCategories.filter((slug) => !slugsInGroup.has(slug));
    if (remaining.length >= minRequired) {
      onChange(remaining);
    } else if (remaining.length === 0 && activeGroupCategories.length > 0) {
      // Keep at least the first one if minRequired applies
      onChange([activeGroupCategories[0].slug]);
    } else {
      onChange(remaining);
    }
  };

  const isBlue = theme === 'blue';

  if (groups.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          {label} <span className="text-rose-500">*</span>
        </label>
        <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 font-medium">
          No activity categories currently available in the database.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-4">
      {/* ── 1. Top Header & Selected Count ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-800">
              {label} <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                isBlue ? 'bg-blue-100 text-[#0066ff]' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {selectedCategories.length} Selected
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {sublabel}
          </p>
        </div>
      </div>

      {/* ── 2. Top Selected Pills Display ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span>Active Academy Offerings ({selectedCategories.length})</span>
          {selectedCategories.length <= minRequired && (
            <span className="text-amber-600 font-bold normal-case">
              (Minimum {minRequired} activity required)
            </span>
          )}
        </div>

        {selectedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            {selectedCategories.map((slug) => {
              const canRemove = selectedCategories.length > minRequired;
              return (
                <span
                  key={slug}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition-all shadow-2xs border ${
                    isBlue
                      ? 'bg-blue-50/80 text-blue-950 border-blue-200/90'
                      : 'bg-emerald-50/80 text-emerald-950 border-emerald-200/90'
                  }`}
                >
                  <span className="text-sm">{getCategoryEmoji(slug)}</span>
                  <span>{getCategoryDisplayName(slug)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(slug)}
                    disabled={!canRemove}
                    className={`ml-1 p-0.5 rounded-md transition-colors ${
                      canRemove
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title={canRemove ? `Remove ${getCategoryDisplayName(slug)}` : 'At least one activity is required'}
                    aria-label={`Remove ${getCategoryDisplayName(slug)}`}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            No activities selected yet. Use the two dropdowns below to add coaching programs.
          </div>
        )}
      </div>

      {/* ── 3. Two Dropdowns Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Dropdown 1: Main Activity Pillar */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. Select Main Activity Pillar
          </label>
          <div className="relative">
            <select
              value={activeMainSlug}
              onChange={(e) => {
                setActiveMainSlug(e.target.value);
                setIsDropdownOpen(false);
              }}
              className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer ${
                isBlue
                  ? 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10 text-slate-900'
                  : 'border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900'
              }`}
            >
              {groups.map((g) => {
                const countInGroup = (g.categories || []).filter((c) =>
                  selectedCategories.includes(c.slug)
                ).length;
                return (
                  <option key={g.slug} value={g.slug}>
                    {g.name} {countInGroup > 0 ? `(${countInGroup} added)` : ''}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <CaretDown size={14} weight="bold" />
            </div>
          </div>
        </div>

        {/* Dropdown 2: Linked Category Multi-Selector */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>2. Linked Categories ({activeGroup.name})</span>
            {selectedInActiveGroup.length > 0 && (
              <span className={`text-[10px] font-extrabold ${isBlue ? 'text-[#0066ff]' : 'text-emerald-700'}`}>
                {selectedInActiveGroup.length} of {activeGroupCategories.length} added
              </span>
            )}
          </label>

          {/* Dropdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
              isDropdownOpen
                ? isBlue
                  ? 'border-[#0066ff] ring-4 ring-blue-500/10 shadow-xs'
                  : 'border-emerald-600 ring-4 ring-emerald-500/10 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="truncate text-slate-800">
              {selectedInActiveGroup.length === 0
                ? `Choose ${activeGroup.name} disciplines...`
                : `${selectedInActiveGroup.length} program${
                    selectedInActiveGroup.length > 1 ? 's' : ''
                  } selected in this activity`}
            </span>
            <CaretDown
              size={14}
              weight="bold"
              className={`shrink-0 ml-2 text-slate-400 transition-transform ${
                isDropdownOpen ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Popover */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
              {/* Quick Batch Select / Deselect Bar */}
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-600">
                  {activeGroupCategories.length} Disciplines Available
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllInGroup}
                    className={`font-extrabold cursor-pointer hover:underline ${
                      isBlue ? 'text-[#0066ff]' : 'text-emerald-700'
                    }`}
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearInGroup}
                    className="font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {activeGroupCategories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleToggle(cat.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                        isChecked
                          ? isBlue
                            ? 'bg-blue-50 text-blue-950 font-bold'
                            : 'bg-emerald-50 text-emerald-950 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <span className="text-base shrink-0">
                          {cat.icon && cat.icon.length <= 4 ? cat.icon : getCategoryEmoji(cat.slug)}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? isBlue
                              ? 'bg-[#0066ff] border-[#0066ff] text-white'
                              : 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={12} weight="bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer Close Button */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-lg text-white cursor-pointer shadow-2xs ${
                    isBlue ? 'bg-[#0066ff] hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="pt-0.5 flex items-start gap-1.5 text-[11px] text-slate-500 font-medium">
        <Sparkle size={14} className={`shrink-0 mt-0.5 ${isBlue ? 'text-blue-500' : 'text-emerald-600'}`} weight="fill" />
        <span>
          <strong>Pro-tip:</strong> Change <em>Dropdown 1 (Main Activity)</em> to add coaching programs across other categories (e.g. Badminton from Sports, Chess from Brain Boosters, Dance from Arts).
        </span>
      </div>
    </div>
  );
}
