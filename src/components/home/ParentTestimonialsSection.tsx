"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  CheckCircle,
  CaretLeft,
  CaretRight,
  Quotes,
  UserCheck,
} from '@phosphor-icons/react';
import { PlatformReviewItem } from '@/lib/platform-reviews-data';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';

export function ParentTestimonialsSection() {
  const [reviews, setReviews] = useState<PlatformReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch dynamic testimonials from DB
  const fetchReviews = React.useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const res = await fetch('/api/homepage-reviews');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: Failed to fetch reviews`);
      }
      const data = await res.json();
      if (data.reviews && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to fetch homepage reviews:', err);
      setDbError(err?.message || 'Database connection error: Could not load parent reviews.');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const cardWidth = 360;
    const newIdx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(reviews.length - 1, Math.max(0, newIdx)));
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [reviews]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 380;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (dbError) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DatabaseErrorView
          compact
          title="Reviews Unavailable"
          message="Parent reviews could not be loaded right now. Please try again later."
          error={dbError}
          onRetry={fetchReviews}
        />
      </section>
    );
  }

  if (!isLoading && reviews.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header with Title and Scroll Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
            <Star size={14} weight="fill" className="text-amber-500" />
            <span>Real Families • Real Transformations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trusted by 1,400+ Parents Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Verified parent testimonials for coaching academies, safe facilities, and athletic growth.
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
              canScrollLeft
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Previous Reviews"
            aria-label="Previous Reviews"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
              canScrollRight
                ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title="Next Reviews"
            aria-label="Next Reviews"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Cards Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-2 px-1 -mx-1"
        tabIndex={0}
        aria-label="Parent Reviews Carousel"
      >
        {reviews.map((rev, index) => (
          <div
            key={rev.id || rev.name}
            className="w-[300px] sm:w-[360px] md:w-[400px] shrink-0 snap-start bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative group"
          >
            <div className="space-y-3">
              {/* Stars & Discipline Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[180px]">
                  {rev.discipline}
                </span>
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium italic min-h-[72px]">
                &ldquo;{rev.quote}&rdquo;
              </p>
            </div>

            {/* Author info */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl ${rev.avatarBg || 'bg-emerald-600'} text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs`}
              >
                {rev.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                  <span className="truncate">{rev.name}</span>
                  <span
                    title="Verified Enrolled Parent"
                    className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full shrink-0 border border-emerald-200/60"
                  >
                    <CheckCircle size={10} weight="fill" className="text-emerald-600" />
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  {rev.childInfo} • {rev.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {reviews.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (!scrollContainerRef.current) return;
              scrollContainerRef.current.scrollTo({
                left: idx * 380,
                behavior: 'smooth',
              });
            }}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === activeIndex ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
