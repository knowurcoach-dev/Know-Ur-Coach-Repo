"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getCoachDashboardData, updateCoachAcademyProfile, getTaxonomyCategories, getClassModes } from '@/lib/actions';
import { DEFAULT_CLASS_MODES, ClassModeItem } from '@/lib/class-modes';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Buildings,
  ArrowLeft,
  Spinner,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Phone,
  User,
  Sparkle,
  Check,
  X,
} from '@phosphor-icons/react';
import { getCategoryEmoji, getCategoryDisplayName } from '@/lib/categories';
import { DatabaseErrorView } from '@/components/ui/DatabaseErrorView';
import { MultiCategorySelector } from '@/components/ui/MultiCategorySelector';

const AGRA_LOCALITIES = [
  'Kamla Nagar',
  'Sanjay Place',
  'Sadar Bazar',
  'Dayalbagh',
  'Tajganj',
  'Civil Lines',
  'Sikandra',
  'Shahganj',
  'Fatehabad Road',
  'Bodla',
];

export default function CoachProfilePage() {
  const { session, user } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['badminton']);
  const [taxonomy, setTaxonomy] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [locality, setLocality] = useState('Kamla Nagar');
  const [address, setAddress] = useState('');
  const [headCoachName, setHeadCoachName] = useState('');
  const [headCoachBio, setHeadCoachBio] = useState('');
  const [classMode, setClassMode] = useState('offline');
  const [classModes, setClassModes] = useState<ClassModeItem[]>(DEFAULT_CLASS_MODES);

  const userEmail = session?.user?.email || (user as any)?.email;

  // Toggle category helper
  const handleToggleCategory = (catSlug: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catSlug)) {
        if (prev.length <= 1) {
          showToast('⚠️ An academy must offer at least one activity.');
          return prev;
        }
        return prev.filter((c) => c !== catSlug);
      }
      return [...prev, catSlug];
    });
  };

  const loadData = React.useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setDbError(null);
    try {
      const [res, tax, modes] = await Promise.all([
        getCoachDashboardData(userEmail),
        getTaxonomyCategories(),
        getClassModes(),
      ]);
      setTaxonomy(tax || []);
      if (modes && modes.length > 0) {
        setClassModes(modes);
      }
      if (res.success && res.centre) {
        setCentreData(res.centre);
        setName(res.centre.name || '');
        setTagline(res.centre.tagline || '');
        setClassMode(res.centre.classMode || 'offline');
        const loadedCategories = (res.centre.category ? res.centre.category.split(',') : ['badminton'])
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
        setSelectedCategories(loadedCategories.length > 0 ? loadedCategories : ['badminton']);
        setLocality(res.centre.locality?.replace('-', ' ') || 'Kamla Nagar');
        setAddress(res.centre.address || '');
        setHeadCoachName(res.centre.headCoachName || '');
        setHeadCoachBio(res.centre.headCoachBio || '');
      }
    } catch (err: any) {
      console.error('[DB_ERROR] Failed to load coach profile data:', err);
      setDbError(err?.message || 'Database connection error: Failed to load coach profile data.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreData?.id) {
      showToast('⚠️ No active academy centre linked to this account.');
      return;
    }

    if (selectedCategories.length === 0) {
      showToast('⚠️ Please select at least one activity category for your academy.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateCoachAcademyProfile({
          centreId: centreData.id,
          name,
          tagline,
          category: selectedCategories.join(','),
          categories: selectedCategories,
          locality,
          address,
          headCoachName,
          headCoachBio,
          classMode,
        });

        if (res.success) {
          showToast('✅ Academy Profile updated successfully!');
        } else {
          showToast(res.message || 'Could not update profile');
        }
      } catch {
        showToast('Error updating profile');
      }
    });
  };

  if (loading) {
    return <GeneralCoachPageSkeleton title="Academy Profile & Venue Details" />;
  }

  if (dbError) {
    return (
      <div className="w-full bg-slate-50 min-h-screen py-12 px-4 flex items-center justify-center">
        <DatabaseErrorView
          title="Unable to Load Profile"
          message="We are having trouble loading your academy profile right now. Please try again."
          error={dbError}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <Link
            href="/coach/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft size={18} weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Academy Profile &amp; Venue Details
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage your public listing details, head coach bio &amp; training facility address
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Spinner size={32} className="animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading academy information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Academy Identification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Academy / Coaching Institute Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ace Sports Academy"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tagline / Pitch for Parents
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Certified NIS coaches, synthetic clay courts and youth tournament batches"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Coaching Delivery Format Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Coaching Delivery Format *</span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Public Badge
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Configured by Admin Panel
                    </span>
                  </label>
                  <select
                    value={classMode}
                    onChange={(e) => setClassMode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {classModes.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.label} {m.description ? `(${m.description})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    This format determines the delivery badge on your cards across homepage, explore filters, and academy details.
                  </p>
                </div>

                {/* Multi-Activity / Category 2-Dropdown Cascading Selector */}
                <MultiCategorySelector
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                  taxonomy={taxonomy}
                  theme="emerald"
                  minRequired={1}
                  label="Offered Activities &amp; Categories"
                  sublabel="Manage your coaching programs. Use Dropdown 1 to choose a main activity pillar, and Dropdown 2 to add or remove linked disciplines."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Locality / Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Kamla Nagar, Dayalbagh, Indiranagar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Physical Venue Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Near Water Tank, Kamla Nagar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Head Coach Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Head Coach Credentials
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Head Coach Full Name &amp; Certification *
                  </label>
                  <input
                    type="text"
                    required
                    value={headCoachName}
                    onChange={(e) => setHeadCoachName(e.target.value)}
                    placeholder="e.g. Rajesh Mehra (NIS Certified)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Coach Bio &amp; Achievements
                  </label>
                  <textarea
                    rows={4}
                    value={headCoachBio}
                    onChange={(e) => setHeadCoachBio(e.target.value)}
                    placeholder="Describe coaching background, national tournament awards, and coaching philosophy..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Saving Profile...' : 'Save Academy Details'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
