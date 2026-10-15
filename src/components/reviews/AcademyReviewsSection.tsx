"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  ThumbsUp,
  ChatCircleText,
  X,
  LockKey,
  PaperPlaneTilt,
  PencilSimple,
  ArrowsClockwise,
  Warning,
  Sparkle,
} from '@phosphor-icons/react';
import { AcademyReviewItem, ReviewEligibilityResult } from '@/lib/reviews';

interface AcademyReviewsSectionProps {
  academyId: string;
  academyName: string;
  initialRating?: number;
  initialReviewsCount?: number;
}

export function AcademyReviewsSection({
  academyId,
  academyName,
  initialRating = 5.0,
  initialReviewsCount = 0,
}: AcademyReviewsSectionProps) {
  const [reviews, setReviews] = useState<AcademyReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(initialReviewsCount);
  const [averageRating, setAverageRating] = useState<number>(initialRating);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Parent Eligibility State
  const [eligibility, setEligibility] = useState<ReviewEligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>('');
  const [imagesInput, setImagesInput] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Lightbox Modal for viewing review photos
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Helpful Votes Tracking (local memory)
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  // 1. Fetch reviews
  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?academyId=${encodeURIComponent(academyId)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalCount(data.totalCount || 0);
        setAverageRating(data.averageRating || 5.0);
        if (data.breakdown) setBreakdown(data.breakdown);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch eligibility
  const checkEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const res = await fetch(`/api/reviews/eligibility?academyId=${encodeURIComponent(academyId)}`);
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
        if (data.existingReview) {
          setRatingInput(data.existingReview.rating || 5);
          setCommentInput(data.existingReview.comment || '');
          setImagesInput(data.existingReview.images || []);
        }
      }
    } catch (err) {
      console.warn('Eligibility check failed:', err);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  useEffect(() => {
    loadReviews();
    checkEligibility();
  }, [academyId]);

  // Handle adding an image URL
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    if (imagesInput.length >= 4) {
      alert('You can attach a maximum of 4 photos per review.');
      return;
    }
    setImagesInput([...imagesInput, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImagesInput(imagesInput.filter((_, idx) => idx !== index));
  };

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const chosenChild = eligibility?.enrolledChildren?.[selectedChildIndex];

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyId,
          rating: ratingInput,
          comment: commentInput,
          images: imagesInput,
          childName: chosenChild?.childName,
          batchName: chosenChild?.batchName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess('Your verified review has been published!');
        setTimeout(() => {
          setIsModalOpen(false);
          loadReviews();
          checkEligibility();
        }, 1200);
      } else {
        setSubmitError(data.message || 'Could not submit review. Please try again.');
      }
    } catch (err: any) {
      setSubmitError('Network error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor - Did not meet expectations',
    2: 'Fair - Needs improvements',
    3: 'Good - Satisfactory training',
    4: 'Very Good - Highly dedicated mentors',
    5: 'Excellent - Exceptional growth & safety',
  };

  return (
    <div id="reviews-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-8">
      {/* ========================================================
          1. SECTION HEADER & METRICS
         ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200/70">
            <ShieldCheck size={14} weight="fill" className="text-emerald-600" />
            <span>100% Verified Enrolled Parent Reviews</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0a1128] tracking-tight">
            Parent Ratings &amp; Experiences
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
            Authentic feedback exclusively from families whose children are enrolled in batches at {academyName}.
          </p>
        </div>

        {/* CTA: Rate & Review button / Eligibility Status */}
        <div className="shrink-0 flex flex-col sm:items-end gap-2">
          {isCheckingEligibility ? (
            <div className="h-10 w-40 bg-slate-100 rounded-2xl animate-pulse" />
          ) : eligibility?.isEligible ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer transform hover:-translate-y-0.5"
            >
              <Star size={16} weight="fill" className="text-amber-300" />
              <span>{eligibility.existingReview ? 'Edit Your Review' : 'Rate & Review Academy'}</span>
            </button>
          ) : eligibility?.reason === 'LOGGED_OUT' ? (
            <Link
              href={`/login?callbackUrl=/activities/${academyId}#reviews-section`}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              <LockKey size={14} weight="bold" />
              <span>Enrolled Parent? Sign in to Review</span>
            </Link>
          ) : (
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-left sm:text-right max-w-xs">
              <div className="text-[11px] font-extrabold text-slate-700 flex items-center sm:justify-end gap-1">
                <ShieldCheck size={13} weight="fill" className="text-blue-600" />
                <span>Verified Enrollment Required</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Only parents with active enrolled children can rate this academy.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. RATING SUMMARY SCORE & BREAKDOWN DISTRIBUTION
         ======================================================== */}
      {totalCount === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 rounded-2xl p-6 border border-emerald-200/70 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-2xl shrink-0 shadow-xs">
            ⭐
          </div>
          <div className="space-y-1 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
              <Sparkle size={12} weight="fill" /> Newly Listed Academy
            </div>
            <h4 className="text-base font-black text-slate-900">
              No parent ratings yet • Be the first to share your experience!
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This academy has been physically inspected &amp; verified by KnowUrCoach. Only parents whose children are enrolled in this academy can post verified reviews.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/70 items-center">
          {/* Overall Big Score */}
          <div className="flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-slate-200/80">
            <div className="text-4xl sm:text-5xl font-black text-[#0a1128] tracking-tight">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  weight={star <= Math.round(averageRating) ? 'fill' : 'bold'}
                  className={star <= Math.round(averageRating) ? 'text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>
            <div className="text-xs font-bold text-slate-600">
              Based on <strong>{totalCount}</strong> verified parent {totalCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* 5-Star Distribution Bars */}
          <div className="md:col-span-2 space-y-2 px-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star] || 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="font-extrabold text-slate-700 w-12 text-right shrink-0 flex items-center justify-end gap-0.5">
                    {star} <Star size={11} weight="fill" className="text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 w-14 text-right shrink-0">
                    {pct}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          3. REVIEWS LIST OR EMPTY STATE
         ======================================================== */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded-md w-36" />
                  <div className="h-2.5 bg-slate-200 rounded-md w-24" />
                </div>
              </div>
              <div className="h-12 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
            <Star size={24} weight="fill" className="text-amber-500" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            No parent reviews yet for {academyName}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Are you an enrolled parent? Be the first to share your child’s coaching journey and court feedback.
          </p>
          {eligibility?.isEligible && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <PencilSimple size={14} weight="bold" />
              <span>Write the First Review</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
            >
              {/* Author & Verification Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                    {rev.parentName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'P'}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{rev.parentName}</span>
                      {rev.isVerifiedEnrollment && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                          <CheckCircle size={10} weight="fill" className="text-emerald-600" />
                          Verified Enrolled Parent
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {rev.childName ? `Parent of ${rev.childName}` : 'Parent'}
                      {rev.batchName ? ` • ${rev.batchName}` : ''}
                    </div>
                  </div>
                </div>

                {/* Rating Stars & Date */}
                <div className="flex items-center gap-2 sm:self-start">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={15} weight={s <= rev.rating ? 'fill' : 'bold'} />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Review Comment (Optional) */}
              {rev.comment && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {rev.comment}
                </p>
              )}

              {/* Attached Photos Gallery (Optional) */}
              {rev.images && rev.images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Shared Court &amp; Training Photos
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {rev.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhoto(imgUrl)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer hover:ring-2 hover:ring-emerald-500"
                        title="Click to view full photo"
                      >
                        <img
                          src={imgUrl}
                          alt="Review attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach Official Response (if present) */}
              {rev.coachReply && (
                <div className="bg-slate-50 rounded-xl p-3.5 border-l-4 border-emerald-500 space-y-1 text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ChatCircleText size={14} weight="fill" className="text-emerald-600" />
                    <span>Response from {academyName}</span>
                    {rev.repliedAt && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        • {new Date(rev.repliedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">&ldquo;{rev.coachReply}&rdquo;</p>
                </div>
              )}

              {/* Helpful Footer Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setHelpfulVoted({ ...helpfulVoted, [rev.id]: !helpfulVoted[rev.id] })}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    helpfulVoted[rev.id] ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ThumbsUp size={13} weight={helpfulVoted[rev.id] ? 'fill' : 'regular'} />
                  <span>{helpfulVoted[rev.id] ? 'Helpful (1)' : 'Helpful'}</span>
                </button>
                <span className="text-[10px] text-slate-400 font-medium">Physically Audited Center</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          4. INTERACTIVE REVIEW SUBMISSION MODAL
         ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {eligibility?.existingReview ? 'Update Your Review' : `Rate ${academyName}`}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Reviewing as <strong>{eligibility?.parentName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200 animate-in fade-in">
                <CheckCircle size={36} weight="fill" className="text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-950 text-base">Review Published!</h4>
                <p className="text-xs text-emerald-800">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {/* 1. Star Rating Selector */}
                <div className="space-y-1.5 text-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Select Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRatingInput(star)}
                        className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                      >
                        <Star
                          size={32}
                          weight={(hoverRating || ratingInput) >= star ? 'fill' : 'bold'}
                          className={(hoverRating || ratingInput) >= star ? 'text-amber-400 drop-shadow-xs' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {ratingDescriptions[hoverRating || ratingInput]}
                  </div>
                </div>

                {/* 2. Enrolled Child & Batch Selector */}
                {eligibility?.enrolledChildren && eligibility.enrolledChildren.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Enrolled Student
                    </label>
                    <select
                      value={selectedChildIndex}
                      onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {eligibility.enrolledChildren.map((c, idx) => (
                        <option key={c.bookingId} value={idx}>
                          {c.childName} ({c.batchName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Optional Comment / Message */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Review Message <span className="font-normal text-slate-400 lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell other parents about the coaching quality, safety, courts, and your child's progress..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Optional Photo Upload / URL Attachments */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Attach Photos <span className="font-normal text-slate-400 lowercase">(optional, max 4)</span>
                  </label>
                  
                  {/* Thumbnails preview */}
                  {imagesInput.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imagesInput.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                          <img src={url} alt="Attached" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-xs"
                          >
                            <X size={10} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {imagesInput.length < 4 && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste image link (e.g. Unsplash, Google Photos)..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        + Add Photo
                      </button>
                    </div>
                  )}

                  {/* Quick sample photo chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] text-slate-500">
                    <span className="font-semibold">Quick Sample Photos:</span>
                    <button
                      type="button"
                      onClick={() => setImagesInput([...imagesInput, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80'])}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      + Court
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setImagesInput([...imagesInput, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'])}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      + Training Session
                    </button>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-1.5 font-medium">
                    <Warning size={14} weight="fill" className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Modal Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowsClockwise size={14} className="animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <PaperPlaneTilt size={14} weight="fill" />
                        <span>Publish Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. FULL PHOTO LIGHTBOX PREVIEW
         ======================================================== */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <img src={activePhoto} alt="Review full size" className="w-full h-full object-contain max-h-[80vh]" />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
