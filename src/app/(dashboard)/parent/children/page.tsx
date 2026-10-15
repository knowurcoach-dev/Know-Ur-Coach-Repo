"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getParentDashboardData, addChildProfile, deleteChildProfile } from '@/lib/actions';
import { ParentBookingsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Users,
  User,
  Plus,
  Trash,
  X,
  Spinner,
  Sparkle,
  Ticket,
  Trophy,
} from '@phosphor-icons/react';

export default function ParentChildrenPage() {
  const { user, session } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Add child modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [interests, setInterests] = useState('');

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getParentDashboardData(userEmail);
      if (res.success) {
        setChildrenList(res.children || []);
        setBookings(res.bookings || []);
      }
    } catch (err) {
      console.warn("Could not load children profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim()) {
      showToast('⚠️ Please provide your child\'s name and age');
      return;
    }

    startTransition(async () => {
      try {
        const interestsArr = interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const res = await addChildProfile(userEmail, {
          fullName: name.trim(),
          age: parseInt(age, 10),
          grade: grade.trim() || undefined,
          interests: interestsArr,
        });

        if (res.success && res.child) {
          setChildrenList((prev) => [...prev, res.child]);
          setIsModalOpen(false);
          setName('');
          setAge('');
          setGrade('');
          setInterests('');
          showToast(`✅ Profile registered for ${res.child.fullName}!`);
        } else {
          showToast(res.message || 'Failed to add child profile');
        }
      } catch {
        showToast('Error saving child profile');
      }
    });
  };

  const handleDeleteChild = (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to remove the profile for ${childName}?`)) return;
    startTransition(async () => {
      try {
        const res = await deleteChildProfile(childId);
        if (res.success) {
          setChildrenList((prev) => prev.filter((c) => c.id !== childId));
          showToast(`Removed profile for ${childName}`);
        }
      } catch {
        showToast('Failed to delete child profile');
      }
    });
  };

  if (loading) {
    return <ParentBookingsSkeleton />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-[#0a1128] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
              <Users size={14} weight="bold" />
              Family Member Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Child Profiles &amp; Enrollments
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Manage your children&apos;s profiles, track their trial bookings, school grade details, and preferred sports activities.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Register New Child</span>
            </button>
          </div>
        </div>

        {/* Children Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading child profiles...</p>
          </div>
        ) : childrenList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {childrenList.map((ch) => {
              const enrolledPasses = bookings.filter((b) =>
                b.child?.fullName?.toLowerCase()?.includes(ch.fullName?.toLowerCase())
              );

              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {ch.fullName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-base">{ch.fullName}</h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Age {ch.age} {ch.grade ? `• ${ch.grade}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteChild(ch.id, ch.fullName)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Child Profile"
                      >
                        <Trash size={16} />
                      </button>
                    </div>

                    {ch.interests && ch.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ch.interests.map((interest: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-100"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Ticket size={15} weight="bold" className="text-blue-600" />
                      <span>{enrolledPasses.length} Active {enrolledPasses.length === 1 ? 'Booking' : 'Bookings'}</span>
                    </div>

                    <Link
                      href="/activities"
                      className="text-blue-600 font-bold hover:underline text-[11px]"
                    >
                      Book Trial Class →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Users size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Child Profiles Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Add your child&apos;s profile to book free trial sessions, customize activity recommendations, and receive direct attendance alerts from verified coaches.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#0066ff] text-white text-xs font-extrabold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>Add Your First Child</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Add Child Profile</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    placeholder="e.g. 9"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    School Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 4"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sports &amp; Hobbies (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tennis, Swimming, Abacus, Chess"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Registering...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
