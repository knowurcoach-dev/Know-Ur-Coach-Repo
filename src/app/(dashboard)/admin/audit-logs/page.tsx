"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowClockwise,
  MagnifyingGlass,
  Spinner,
  Clock,
  User,
  Tag,
  CheckCircle,
  XCircle,
  Warning,
  Gear,
  Star,
  ChatCircleDots,
  Eye,
  EyeSlash,
  Trash,
  Plus,
  PencilSimple,
  X,
  Camera,
  Buildings,
  Phone,
  Envelope,
  Quotes,
} from '@phosphor-icons/react';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { PlatformReviewItem } from '@/lib/reviews';

interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetModel: string;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AdminReviewEntry {
  id: string;
  coachingCentreId: string;
  academyName: string;
  academyLocality: string;
  headCoachName: string;
  userId: string;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  childName: string | null;
  batchName: string | null;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedEnrollment: boolean;
  status: string;
  coachReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'reviews' | 'homepage'>('reviews');

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');

  // Academy Parent Reviews State
  const [reviews, setReviews] = useState<AdminReviewEntry[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>('ALL');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('ALL');
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<AdminReviewEntry | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  // Homepage Reviews State
  const [homepageReviews, setHomepageReviews] = useState<PlatformReviewItem[]>([]);
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [editingHomepageReview, setEditingHomepageReview] = useState<Partial<PlatformReviewItem> | null>(null);
  const [isSavingHomepageReview, setIsSavingHomepageReview] = useState(false);

  // 1. Fetch Audit Logs
  const fetchLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  // 2. Fetch Parent Academy Reviews
  const fetchReviews = async () => {
    setIsReviewsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  // 3. Fetch Homepage Testimonials
  const fetchHomepageReviews = async () => {
    setIsHomepageLoading(true);
    try {
      const res = await fetch('/api/admin/homepage-reviews');
      if (res.ok) {
        const data = await res.json();
        setHomepageReviews(data.reviews || []);
      }
    } catch (err) {
      console.warn('Failed to load homepage reviews:', err);
    } finally {
      setIsHomepageLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchReviews();
    fetchHomepageReviews();
  }, []);

  // Moderate Review Status
  const handleToggleReviewStatus = async (reviewId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: nextStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch (err) {
      alert('Failed to update review status.');
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? Academy rating will be recalculated.')) return;
    try {
      const res = await fetch(`/api/admin/reviews?reviewId=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (selectedReviewForModal?.id === reviewId) setSelectedReviewForModal(null);
      }
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  // Save Homepage Review (Create or Update)
  const handleSaveHomepageReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomepageReview) return;
    setIsSavingHomepageReview(true);
    try {
      const res = await fetch('/api/admin/homepage-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHomepageReview),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchHomepageReviews();
        setEditingHomepageReview(null);
      } else {
        alert(data.message || 'Failed to save review.');
      }
    } catch (err) {
      alert('Error saving homepage review.');
    } finally {
      setIsSavingHomepageReview(false);
    }
  };

  // Delete Homepage Review
  const handleDeleteHomepageReview = async (id: string) => {
    if (!confirm('Delete this homepage testimonial?')) return;
    try {
      const res = await fetch(`/api/admin/homepage-reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchHomepageReviews();
      }
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !logSearchQuery ||
      log.actorEmail.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.targetModel.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesAction = logActionFilter === 'ALL' || log.action === logActionFilter;
    return matchesSearch && matchesAction;
  });

  // Filtered Reviews
  const filteredReviews = reviews.filter((r) => {
    const q = reviewSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.parentName.toLowerCase().includes(q) ||
      (r.parentEmail && r.parentEmail.toLowerCase().includes(q)) ||
      (r.parentPhone && r.parentPhone.toLowerCase().includes(q)) ||
      r.academyName.toLowerCase().includes(q) ||
      r.headCoachName.toLowerCase().includes(q) ||
      (r.childName && r.childName.toLowerCase().includes(q)) ||
      r.comment.toLowerCase().includes(q);

    const matchesRating =
      reviewRatingFilter === 'ALL' || r.rating === parseInt(reviewRatingFilter, 10);

    const matchesStatus =
      reviewStatusFilter === 'ALL' || r.status === reviewStatusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
          <CheckCircle size={12} weight="fill" /> {action}
        </span>
      );
    }
    if (action.includes('REJECTED') || action.includes('DELETED')) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
          <XCircle size={12} weight="fill" /> {action}
        </span>
      );
    }
    if (action.includes('REFERRED') || action.includes('SUSPENDED') || action.includes('HIDDEN')) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
          <Warning size={12} weight="fill" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
        <Gear size={12} weight="bold" /> {action}
      </span>
    );
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* ========================================================
            HEADER & TAB NAVIGATION
           ======================================================== */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase mb-2">
                <ShieldCheck size={14} weight="fill" /> Platform Governance &amp; Moderation
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Audit Trail, Reviews &amp; Testimonials
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor security actions, manage verified parent reviews, and control homepage testimonials.
              </p>
            </div>

            <button
              onClick={() => {
                fetchLogs();
                fetchReviews();
                fetchHomepageReviews();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ArrowClockwise size={15} />
              <span>Refresh All</span>
            </button>
          </div>

          {/* 3 Top Level Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-4 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'reviews'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star size={15} weight="fill" className={activeTab === 'reviews' ? 'text-amber-300' : 'text-amber-500'} />
              <span>Parent Reviews &amp; Ratings ({reviews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('homepage')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'homepage'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Quotes size={15} weight="fill" />
              <span>Homepage Testimonials ({homepageReviews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck size={15} weight="fill" />
              <span>Security Audit Trail ({logs.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: PARENT REVIEWS & RATINGS TABLE
           ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Reviews</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{reviews.length}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">5-Star Reviews</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                  {reviews.filter((r) => r.rating === 5).length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">With Photos</span>
                <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                  {reviews.filter((r) => r.images && r.images.length > 0).length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Hidden / Moderated</span>
                <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                  {reviews.filter((r) => r.status === 'HIDDEN').length}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  placeholder="Search by parent name, phone, email, academy, coach, or comment text..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Rating Filter */}
              <select
                value={reviewRatingFilter}
                onChange={(e) => setReviewRatingFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full sm:w-auto"
              >
                <option value="ALL">All Star Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>

              {/* Status Filter */}
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full sm:w-auto"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved Only</option>
                <option value="HIDDEN">Hidden Only</option>
              </select>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Parent Details</th>
                      <th className="py-3 px-4">Enrolled Child &amp; Batch</th>
                      <th className="py-3 px-4">Academy &amp; Coach</th>
                      <th className="py-3 px-4 text-center">Rating</th>
                      <th className="py-3 px-4">Review Message &amp; Photos</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {isReviewsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Spinner size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                          Loading verified reviews...
                        </td>
                      </tr>
                    ) : filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No parent reviews match your active search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map((rev) => (
                        <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                            <div className="text-[10px] text-slate-400">
                              {new Date(rev.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Parent Details */}
                          <td className="py-3.5 px-4 min-w-[160px]">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1">
                              <span>{rev.parentName}</span>
                              {rev.isVerifiedEnrollment && (
                                <span title="Verified Enrolled Parent">
                                  <CheckCircle size={12} weight="fill" className="text-emerald-600" />
                                </span>
                              )}
                            </div>
                            {rev.parentPhone && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Phone size={10} />
                                <span>{rev.parentPhone}</span>
                              </div>
                            )}
                            {rev.parentEmail && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {rev.parentEmail}
                              </div>
                            )}
                          </td>

                          {/* Child & Batch */}
                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="font-bold text-slate-800">
                              {rev.childName || 'Enrolled Student'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                              {rev.batchName || 'Regular Batch'}
                            </div>
                          </td>

                          {/* Academy & Coach */}
                          <td className="py-3.5 px-4 min-w-[160px]">
                            <div className="font-extrabold text-blue-700">
                              {rev.academyName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Coach: <strong>{rev.headCoachName || 'Assigned Coach'}</strong>
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-black text-xs">
                              <Star size={12} weight="fill" className="text-amber-500" />
                              {rev.rating}.0
                            </span>
                          </td>

                          {/* Review Content & Photos */}
                          <td className="py-3.5 px-4 max-w-[260px]">
                            <p className="text-slate-700 line-clamp-2 text-xs">
                              {rev.comment ? `“${rev.comment}”` : <span className="text-slate-400 italic">No message provided (Rating only)</span>}
                            </p>
                            {rev.images && rev.images.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Camera size={12} className="text-blue-600 shrink-0" />
                                <span className="text-[10px] font-bold text-blue-600">
                                  {rev.images.length} photo(s):
                                </span>
                                {rev.images.map((img, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveImagePreview(img)}
                                    className="w-5 h-5 rounded-md overflow-hidden border border-slate-200 hover:scale-125 transition-transform"
                                  >
                                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {rev.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} weight="fill" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                <EyeSlash size={10} weight="fill" /> Hidden
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleReviewStatus(rev.id, rev.status)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  rev.status === 'APPROVED'
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={rev.status === 'APPROVED' ? 'Hide from public listing' : 'Approve for public listing'}
                              >
                                {rev.status === 'APPROVED' ? <EyeSlash size={14} /> : <Eye size={14} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Permanently delete review"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: HOMEPAGE TESTIMONIALS (CRUD)
           ======================================================== */}
        {activeTab === 'homepage' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Featured Homepage Testimonials Carousel
                </h3>
                <p className="text-xs text-slate-500">
                  These parent testimonials appear on the homepage horizontal scroll carousel.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingHomepageReview({
                    id: 'new-' + Date.now(),
                    name: '',
                    location: 'Agra',
                    childInfo: 'Mother of Child (8 Yrs)',
                    discipline: 'Sports & Athletics',
                    quote: '',
                    rating: 5,
                    avatarBg: 'bg-emerald-600',
                    order: homepageReviews.length + 1,
                  })
                }
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus size={15} weight="bold" />
                <span>+ Add Homepage Testimonial</span>
              </button>
            </div>

            {/* Testimonials Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isHomepageLoading ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <Spinner size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                  Loading homepage testimonials...
                </div>
              ) : (
                homepageReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} size={15} weight="fill" />
                          ))}
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {rev.discipline}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        &ldquo;{rev.quote}&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl ${rev.avatarBg || 'bg-emerald-600'} text-white font-black flex items-center justify-center text-[10px] shrink-0`}
                        >
                          {rev.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {rev.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {rev.childInfo} • {rev.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setEditingHomepageReview(rev)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Edit review"
                        >
                          <PencilSimple size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHomepageReview(rev.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete review"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: SYSTEM AUDIT LOGS TRAIL
           ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 w-full">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search by admin email, action name, target ID, or diff payload..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'COACH_APPROVED', 'COACH_REJECTED', 'CONFIG_UPDATED', 'ACADEMY_REVIEW_CREATED'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setLogActionFilter(action)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      logActionFilter === action
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Operator / Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Model</th>
                      <th className="py-3 px-4">Event Details &amp; Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {isLogsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Spinner size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
                          Loading security logs...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No audit log records match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900">{log.actorEmail}</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{log.actorRole}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700">
                            {log.targetModel}
                            {log.targetId && (
                              <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[120px]">
                                {log.targetId}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <pre className="text-[10px] font-mono bg-slate-100 p-2 rounded-lg overflow-x-auto max-w-sm sm:max-w-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: ADD / EDIT HOMEPAGE TESTIMONIAL
           ======================================================== */}
        {editingHomepageReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-base text-slate-900">
                  {editingHomepageReview.id?.startsWith('new-') ? 'Add Homepage Testimonial' : 'Edit Testimonial'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingHomepageReview(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveHomepageReview} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Parent Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pooja Sharma"
                    value={editingHomepageReview.name || ''}
                    onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kamla Nagar, Agra"
                      value={editingHomepageReview.location || ''}
                      onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Child Info
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mother of Aarav (8 Yrs)"
                      value={editingHomepageReview.childInfo || ''}
                      onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, childInfo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Discipline Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Badminton & Tennis"
                      value={editingHomepageReview.discipline || ''}
                      onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, discipline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Rating (Stars)
                    </label>
                    <select
                      value={editingHomepageReview.rating || 5}
                      onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Testimonial Quote *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write the quote from the parent..."
                    value={editingHomepageReview.quote || ''}
                    onChange={(e) => setEditingHomepageReview({ ...editingHomepageReview, quote: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingHomepageReview(null)}
                    className="px-4 py-2 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingHomepageReview}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isSavingHomepageReview ? 'Saving...' : 'Save Testimonial'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: IMAGE LIGHTBOX PREVIEW
           ======================================================== */}
        {activeImagePreview && (
          <div
            onClick={() => setActiveImagePreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
              <img src={activeImagePreview} alt="Preview" className="w-full h-full object-contain max-h-[80vh]" />
              <button
                onClick={() => setActiveImagePreview(null)}
                className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
