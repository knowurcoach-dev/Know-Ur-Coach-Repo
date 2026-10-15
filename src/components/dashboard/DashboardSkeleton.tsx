"use client";

import React from 'react';

/**
 * Modern shimmering skeletons designed to prevent any layout shift
 * and eliminate flash of default/empty values on initial load or reload.
 */

export function CoachDashboardSkeleton() {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Card Skeleton */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0a1128] to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 w-full max-w-xl">
            <div className="w-56 h-6 bg-white/20 rounded-full" />
            <div className="w-80 h-9 bg-white/25 rounded-2xl" />
            <div className="w-96 max-w-full h-4 bg-white/15 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-36 h-10 bg-white/20 rounded-xl" />
            <div className="w-36 h-10 bg-white/20 rounded-xl" />
          </div>
        </div>

        {/* Banner Alert Skeleton */}
        <div className="bg-slate-200/80 rounded-3xl p-6 h-36 border border-slate-300/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-300" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-300 rounded-md" />
              <div className="w-72 h-6 bg-slate-300 rounded-lg" />
              <div className="w-96 max-w-full h-3.5 bg-slate-300 rounded-md" />
            </div>
          </div>
          <div className="w-40 h-10 bg-slate-300 rounded-xl hidden sm:block" />
        </div>

        {/* 4 Stat Cards Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-24 h-3.5 bg-slate-200 rounded-md" />
                <div className="w-8 h-8 bg-slate-100 rounded-xl" />
              </div>
              <div className="w-20 h-7 bg-slate-200 rounded-lg" />
              <div className="w-32 h-3 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Two-Column Hub Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="w-48 h-6 bg-slate-200 rounded-lg" />
              <div className="w-24 h-6 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-40 h-6 bg-slate-200 rounded-lg border-b border-slate-100 pb-4" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParentBookingsSkeleton() {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Skeleton */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 w-full max-w-xl">
            <div className="w-48 h-5 bg-white/20 rounded-full" />
            <div className="w-72 h-8 bg-white/25 rounded-2xl" />
            <div className="w-96 max-w-full h-4 bg-white/15 rounded-lg" />
          </div>
          <div className="w-64 h-16 bg-white/10 rounded-2xl shrink-0" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-9 bg-slate-200 rounded-xl" />
          ))}
        </div>

        {/* Passes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 h-64 overflow-hidden shadow-xs space-y-4">
              <div className="bg-slate-200 h-28" />
              <div className="p-4 space-y-3">
                <div className="w-40 h-5 bg-slate-200 rounded-md" />
                <div className="w-56 h-4 bg-slate-100 rounded-md" />
                <div className="w-28 h-8 bg-slate-200 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Skeleton */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="w-64 h-5 bg-white/20 rounded-full" />
            <div className="w-80 h-9 bg-white/25 rounded-2xl" />
            <div className="w-96 max-w-full h-4 bg-white/15 rounded-lg" />
          </div>
          <div className="w-32 h-10 bg-white/20 rounded-xl" />
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-28 h-4 bg-slate-200 rounded-md" />
              <div className="w-16 h-8 bg-slate-300 rounded-lg" />
              <div className="w-36 h-3 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Table & Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="w-48 h-6 bg-slate-200 rounded-lg" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="w-40 h-6 bg-slate-200 rounded-lg" />
            <div className="h-56 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminVerifySkeleton() {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Skeleton */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="w-64 h-5 bg-white/20 rounded-full" />
            <div className="w-80 h-9 bg-white/25 rounded-2xl" />
            <div className="w-96 max-w-full h-4 bg-white/15 rounded-lg" />
          </div>
          <div className="w-32 h-10 bg-white/20 rounded-xl" />
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-24 h-3 bg-slate-200 rounded-md" />
              <div className="w-12 h-7 bg-slate-300 rounded-lg" />
              <div className="w-28 h-3 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 h-16" />

        {/* Coach list items */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 h-44 shadow-xs space-y-3">
              <div className="flex justify-between">
                <div className="w-36 h-5 bg-slate-200 rounded-full" />
                <div className="w-24 h-5 bg-slate-100 rounded-md" />
              </div>
              <div className="w-64 h-6 bg-slate-300 rounded-lg" />
              <div className="w-96 h-4 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoachPlansSkeleton() {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-72 h-7 bg-slate-200 rounded-xl" />
            <div className="w-96 h-4 bg-slate-100 rounded-md" />
          </div>
          <div className="w-40 h-10 bg-slate-200 rounded-2xl" />
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 h-40" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 h-96 p-6 space-y-4 shadow-xs">
              <div className="w-40 h-6 bg-slate-200 rounded-lg" />
              <div className="w-24 h-8 bg-slate-300 rounded-xl" />
              <div className="space-y-2 pt-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="w-full h-4 bg-slate-100 rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GeneralCoachPageSkeleton({ title }: { title?: string }) {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-56 h-7 bg-slate-200 rounded-xl">
              {title && <span className="opacity-0">{title}</span>}
            </div>
            <div className="w-80 h-4 bg-slate-100 rounded-md" />
          </div>
          <div className="w-32 h-10 bg-slate-200 rounded-2xl" />
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="w-48 h-6 bg-slate-200 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
        >
          {/* Image Shimmer */}
          <div className="h-48 sm:h-52 bg-slate-200 relative">
            <div className="absolute top-3 left-3 w-28 h-6 bg-white/70 rounded-full" />
            <div className="absolute top-3 right-3 w-16 h-6 bg-white/70 rounded-full" />
          </div>

          {/* Details Shimmer */}
          <div className="p-5 space-y-3">
            <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
            <div className="w-1/2 h-4 bg-slate-100 rounded-md" />

            <div className="flex gap-2 pt-2">
              <div className="w-20 h-5 bg-slate-100 rounded-full" />
              <div className="w-24 h-5 bg-slate-100 rounded-full" />
              <div className="w-16 h-5 bg-slate-100 rounded-full" />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="w-24 h-6 bg-slate-200 rounded-md" />
              <div className="w-28 h-9 bg-emerald-100 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 h-72 sm:h-80 flex flex-col justify-end space-y-4">
        <div className="w-36 h-6 bg-white/20 rounded-full" />
        <div className="w-3/4 sm:w-1/2 h-10 bg-white/25 rounded-2xl" />
        <div className="w-full sm:w-2/3 h-5 bg-white/15 rounded-lg" />
      </div>

      {/* Main Grid: Details Left, Booking Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-xs">
            <div className="w-48 h-6 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-slate-100 rounded" />
              <div className="w-5/6 h-4 bg-slate-100 rounded" />
              <div className="w-4/6 h-4 bg-slate-100 rounded" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-xs">
            <div className="w-40 h-6 bg-slate-200 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <div className="w-32 h-5 bg-slate-200 rounded" />
                  <div className="w-24 h-4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Booking Pass Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 h-96">
            <div className="w-32 h-5 bg-slate-200 rounded-full" />
            <div className="w-48 h-8 bg-slate-300 rounded-xl" />
            <div className="w-full h-12 bg-emerald-200 rounded-2xl" />
            <div className="w-full h-12 bg-slate-200 rounded-2xl" />
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="w-full h-3 bg-slate-100 rounded" />
              <div className="w-3/4 h-3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ title }: { title?: string }) {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="w-48 h-5 bg-white/20 rounded-full" />
            <div className="w-72 h-8 bg-white/25 rounded-2xl">
              {title && <span className="opacity-0">{title}</span>}
            </div>
            <div className="w-96 max-w-full h-4 bg-white/15 rounded-lg" />
          </div>
          <div className="w-36 h-10 bg-white/20 rounded-xl" />
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center h-16">
          <div className="w-72 h-8 bg-slate-100 rounded-xl" />
          <div className="w-48 h-8 bg-slate-100 rounded-xl hidden sm:block" />
        </div>

        {/* Table rows */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4 sm:p-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-4 justify-between">
              <div className="w-48 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-100 rounded hidden sm:block" />
              <div className="w-32 h-4 bg-slate-100 rounded hidden md:block" />
              <div className="w-20 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

