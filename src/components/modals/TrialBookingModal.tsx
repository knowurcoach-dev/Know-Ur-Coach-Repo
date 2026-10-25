"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { bookTrialSession, getParentDashboardData, addChildProfile, getBatchesForCentre } from '@/lib/actions';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  Ticket,
  CheckCircle,
  Copy,
  DownloadSimple,
  CalendarBlank,
  Clock,
  User,
  Sparkle,
  CircleNotch,
  Plus,
  UserPlus,
  Check,
  LockKey,
} from '@phosphor-icons/react';

function getUpcomingTrialDates(): Array<{ label: string; value: string }> {
  const dates: Array<{ label: string; value: string }> = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = daysOfWeek[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const prefix = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName;
    const label = `${prefix}, ${dateNum} ${monthName} (${dayName})`;
    const value = `${prefix}, ${dateNum} ${monthName} (${dayName})`;
    dates.push({ label, value });
  }
  return dates;
}

export function TrialBookingModal() {
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();
  const { showToast } = usePersona();
  const { session, user, isGuest } = useAuth();
  const router = useRouter();

  const passedBatches = modalData?.batches || modalData?.academy?.batches || [];
  const [batchesList, setBatchesList] = useState<any[]>(passedBatches);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildNames, setSelectedChildNames] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [isExistingPass, setIsExistingPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Quick Add Child inline state
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  const isModalOpen = isOpen && activeModal === 'trial-booking';

  const acadName = modalData?.acadName || modalData?.academy?.name || 'Selected Academy';
  const acadCity = modalData?.city || modalData?.academy?.city || '';
  const acadLocality = modalData?.locality || modalData?.academy?.localityName || (acadCity || 'City Center');
  const acadCategory = modalData?.category || modalData?.academy?.category || 'Sports & Extracurricular';

  const userEmail = session?.user?.email || (user as any)?.email;
  const upcomingDates = getUpcomingTrialDates();

  // Initialize selected batch & load batches dynamically if missing
  useEffect(() => {
    if (!isModalOpen) return;

    const directBatches = modalData?.batches || modalData?.academy?.batches || [];
    if (directBatches.length > 0) {
      setBatchesList(directBatches);
      const initBatchId = modalData?.selectedBatchId || modalData?.selectedBatch?.id || directBatches[0]?.id || '';
      setSelectedBatchId(initBatchId);
      const matched = directBatches.find((b: any) => b.id === initBatchId) || directBatches[0];
      setSelectedSlot(matched?.pureSchedule || matched?.schedule || matched?.time || '');
    } else {
      const centreId = modalData?.acadId || modalData?.academy?.id;
      if (centreId) {
        setLoadingBatches(true);
        getBatchesForCentre(centreId)
          .then((fetched) => {
            setBatchesList(fetched || []);
            if (fetched && fetched.length > 0) {
              const initBatchId = modalData?.selectedBatchId || fetched[0].id;
              setSelectedBatchId(initBatchId);
              const matched = fetched.find((b: any) => b.id === initBatchId) || fetched[0];
              setSelectedSlot(matched?.pureSchedule || matched?.schedule || matched?.time || '');
            }
          })
          .finally(() => {
            setLoadingBatches(false);
          });
      } else {
        setBatchesList([]);
      }
    }
  }, [isModalOpen, modalData]);

  // Preselect tomorrow as default trial date
  useEffect(() => {
    if (isModalOpen && !selectedDate && upcomingDates.length > 0) {
      setSelectedDate(upcomingDates[1]?.value || upcomingDates[0]?.value || '');
    }
  }, [isModalOpen, selectedDate, upcomingDates]);

  // Load children profiles when modal opens
  useEffect(() => {
    if (!isModalOpen || isGuest || !userEmail) return;

    async function fetchChildren() {
      setLoadingChildren(true);
      try {
        const res = await getParentDashboardData(userEmail);
        if (res?.children && res.children.length > 0) {
          setChildrenList(res.children);
          setSelectedChildNames([res.children[0].fullName]);
        } else {
          setChildrenList([]);
          setSelectedChildNames([]);
          setShowAddChild(true);
        }
      } catch (err) {
        console.warn('Could not load children in modal:', err);
        setChildrenList([]);
        setSelectedChildNames([]);
      } finally {
        setLoadingChildren(false);
      }
    }

    fetchChildren();
  }, [isModalOpen, userEmail, isGuest]);

  const handleClose = () => {
    closeModal();
    setTimeout(() => {
      setStep('form');
      setShowAddChild(false);
    }, 300);
  };

  const toggleChildSelection = (childFullName: string) => {
    setSelectedChildNames((prev) => {
      if (prev.includes(childFullName)) {
        // Keep at least one or allow unselecting
        if (prev.length === 1) return prev;
        return prev.filter((name) => name !== childFullName);
      } else {
        return [...prev, childFullName];
      }
    });
  };

  const handleQuickAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildAge.trim()) {
      showToast('⚠️ Please enter child name and age');
      return;
    }

    setAddingChild(true);
    try {
      const targetEmail = userEmail || 'parent@knowurcoach.in';
      const res = await addChildProfile(targetEmail, {
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 7,
      });

      const newChildObj = res?.child || {
        id: `child-${Date.now()}`,
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 7,
      };

      setChildrenList((prev) => [...prev, newChildObj]);
      setSelectedChildNames((prev) => [...prev, newChildObj.fullName]);
      setNewChildName('');
      setNewChildAge('');
      setShowAddChild(false);
      showToast(`✅ Added ${newChildObj.fullName}! Selected for trial.`);
    } catch {
      showToast('⚠️ Could not save child profile. Selected locally.');
      const localChild = {
        id: `child-${Date.now()}`,
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 7,
      };
      setChildrenList((prev) => [...prev, localChild]);
      setSelectedChildNames((prev) => [...prev, localChild.fullName]);
      setNewChildName('');
      setNewChildAge('');
      setShowAddChild(false);
    } finally {
      setAddingChild(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChildNames.length === 0) {
      showToast('⚠️ Please select at least one child for the trial session');
      return;
    }
    if (!selectedDate) {
      showToast('⚠️ Please choose a preferred trial date');
      return;
    }
    if (!selectedSlot) {
      showToast('⚠️ Please choose an available time slot');
      return;
    }

    setSubmitting(true);
    try {
      const selectedBatch = batchesList.find((b: any) => b.id === selectedBatchId) || batchesList[0];
      const res = await bookTrialSession({
        centreId: modalData?.acadId || modalData?.academy?.id || 'acad-default',
        centreName: acadName,
        batchId: selectedBatch?.id,
        batchName: selectedBatch?.name,
        childNames: selectedChildNames,
        childName: selectedChildNames.join(', '),
        date: selectedDate,
        timeSlot: selectedSlot || selectedBatch?.pureSchedule || selectedBatch?.schedule || selectedBatch?.time || 'Scheduled Timing',
        parentEmail: userEmail || session?.user?.email || undefined,
        parentName: session?.user?.name || (user as any)?.name || undefined,
        parentPhone: (session?.user as any)?.phone || (user as any)?.phone || undefined,
      });

      if (!res.success) {
        showToast(`⚠️ ${res.message || 'Failed to book free trial session'}`);
        return;
      }

      setBookingId(res.bookingId);
      setIsExistingPass(Boolean(res.isExisting));
      setStep('success');

      if (res.isExisting) {
        showToast(`ℹ️ Active Free Trial pass already exists for ${selectedChildNames.join(' & ')}!`);
      } else {
        showToast(res.message || `🎉 Free Trial confirmed for ${selectedChildNames.join(' & ')} at ${acadName}!`);
      }
    } catch (err: any) {
      console.error('Booking session error:', err);
      showToast(err?.message || 'Failed to book trial session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <DialogWrapper
      id="activity-trial-modal"
      isOpen={isModalOpen}
      onClose={handleClose}
      icon={<Ticket size={20} weight="fill" />}
      title="Book Free Trial Session"
      subtitle="Free Trial with KnowUrCoach Guarantee"
      headerGradient="bg-gradient-to-r from-blue-50 to-indigo-50"
    >
      {isGuest || !userEmail ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
            <LockKey size={32} weight="fill" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              Parent Sign-In Required
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Please sign in or create a parent account to book your 100% Free Trial session, select your child profile, and receive your confirmed booking reference number.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                handleClose();
                router.push('/login?callbackUrl=/activities');
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 shadow-md transition-all cursor-pointer"
            >
              Sign In to Parent Account
            </button>
            <button
              onClick={() => {
                handleClose();
                router.push('/register-parent');
              }}
              className="px-5 py-2.5 rounded-xl border border-blue-200 text-blue-800 font-extrabold text-xs hover:bg-blue-50 transition-all cursor-pointer"
            >
              Create Free Parent Profile
            </button>
          </div>
        </div>
      ) : loadingBatches ? (
        <div className="p-8 text-center space-y-3">
          <CircleNotch size={32} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Checking available coaching batches...</p>
        </div>
      ) : batchesList.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock size={28} weight="bold" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Batches Not Configured Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            This academy has not configured open coaching batches yet. Please contact the coach directly or check back soon.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      ) : step === 'form' ? (
        /* Step 1: Trial Booking Form */
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Selected Center Info */}
          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
            <div className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider">
              Selected Academy / Center
            </div>
            <div className="font-extrabold text-gray-900 text-sm mt-0.5">
              {acadName}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {acadLocality}{acadCity ? `, ${acadCity}` : ''} • {acadCategory}
            </div>
          </div>

          {/* Coaching Batch Selection */}
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">
              Select Coaching Batch &amp; Timing *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                const bId = e.target.value;
                setSelectedBatchId(bId);
                const matched = batchesList.find((b: any) => b.id === bId);
                if (matched?.pureSchedule || matched?.schedule || matched?.time) {
                  setSelectedSlot(matched.pureSchedule || matched.schedule || matched.time);
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {batchesList.map((b: any) => (
                <option key={b.id || b.name} value={b.id}>
                  {b.name} ({b.pureSchedule || b.schedule || b.time}) {b.ageGroup ? `• Age ${b.ageGroup}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Child Details: Selection Dropdown & Multi-Select with Quick Add */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">
                Select Child * {selectedChildNames.length > 1 && `(${selectedChildNames.length} Selected)`}
              </label>
              {!showAddChild && (
                <button
                  type="button"
                  onClick={() => setShowAddChild(true)}
                  className="text-blue-600 hover:text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} weight="bold" /> Add Child
                </button>
              )}
            </div>

            {/* Quick Add Child Inline Form */}
            {showAddChild && (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900">
                  <span className="flex items-center gap-1">
                    <UserPlus size={14} weight="bold" /> Add Child Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddChild(false)}
                    className="text-gray-400 hover:text-gray-600 text-[10px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Child's Full Name"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="3"
                    max="18"
                    placeholder="Age (Yrs)"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddChild}
                  disabled={addingChild}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {addingChild ? <CircleNotch size={14} className="animate-spin" /> : <Plus size={14} weight="bold" />}
                  Save &amp; Select Child
                </button>
              </div>
            )}

            {/* If no children exist */}
            {childrenList.length === 0 && !showAddChild && (
              <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center space-y-2">
                <User size={24} className="mx-auto text-gray-400" />
                <p className="text-gray-500 text-[11px]">No child profile registered yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddChild(true)}
                  className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} weight="bold" /> Add Child Now
                </button>
              </div>
            )}

            {/* Children Selection Chips / Dropdown List */}
            {childrenList.length > 0 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {childrenList.map((child: any) => {
                    const isSelected = selectedChildNames.includes(child.fullName);
                    return (
                      <button
                        type="button"
                        key={child.id || child.fullName}
                        onClick={() => toggleChildSelection(child.fullName)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {child.fullName.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-extrabold text-xs truncate">{child.fullName}</div>
                            <div className="text-[10px] text-gray-500 font-medium">Age {child.age} yrs</div>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={10} weight="bold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400">
                  Tip: You can select multiple children to book free trials together.
                </p>
              </div>
            )}
          </div>

          {/* Date & Slot Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wide mb-1">
                Preferred Date *
              </label>
              <div className="relative">
                <CalendarBlank
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <select
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer text-gray-800"
                >
                  <option value="" disabled>Select date</option>
                  {upcomingDates.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-wide mb-1">
                Batch Timing &amp; Slot
              </label>
              <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-2.5 text-xs font-bold text-blue-900 flex items-center gap-2">
                <Clock size={15} className="text-blue-600 shrink-0" />
                <span className="truncate">
                  {selectedSlot || batchesList.find((b: any) => b.id === selectedBatchId)?.schedule || batchesList[0]?.schedule || 'Scheduled Batch Timing'}
                </span>
              </div>
            </div>
          </div>

          {/* Clean 100% Free Trial Guarantee without fee breakdown */}
          <div className="bg-emerald-50/90 rounded-2xl p-3 border border-emerald-200 text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle size={16} weight="fill" />
            </div>
            <div>
              <div className="font-extrabold text-emerald-950 text-xs">100% Free Trial Session</div>
              <div className="text-[11px] text-emerald-700">Meet the coach &amp; experience the training environment with zero commitment.</div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0066ff] hover:bg-blue-700 disabled:opacity-70 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            {submitting ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" /> Generating Verified Pass...
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" /> Confirm Free Trial Booking
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: Trial Success Pass */
        <div className="p-5 space-y-4 text-xs text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-1 animate-bounce shadow-sm">
            <CheckCircle size={36} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0a1128]">
              {isExistingPass ? 'Active Pass Already Exists!' : 'Trial Confirmed!'}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isExistingPass
                ? 'Your child already has an active Free Trial pass for this academy. No duplicate pass was created.'
                : "We notified the academy. Your child's official pass is ready below."}
            </p>
          </div>

          {/* Official Pass Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 shadow-xl text-left relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                  CONFIRMED FREE TRIAL BOOKING
                </div>
                <div className="font-extrabold text-base mt-0.5">
                  {acadName}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider">
                100% FREE TRIAL
              </div>
            </div>

            <div className="border-t border-dashed border-white/30 my-2.5" />

            <div className="grid grid-cols-2 gap-2.5 text-[10px] mb-3.5">
              <div>
                <div className="text-white/70 font-medium">Child(ren)</div>
                <div className="font-bold text-white text-xs">{selectedChildNames.join(', ')}</div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Reference Number</div>
                <div className="font-mono font-bold text-amber-200 text-xs">
                  {bookingId.startsWith('REF-') ? bookingId : bookingId.replace('KUC-PASS-', 'REF-')}
                </div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Batch &amp; Schedule</div>
                <div className="font-bold text-white text-[11px] truncate">
                  {batchesList.find((b: any) => b.id === selectedBatchId)?.name || 'Coaching Batch'} • {selectedDate || 'Upcoming'}
                </div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Status</div>
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle size={12} weight="fill" /> Confirmed &amp; Reserved
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl flex items-center justify-between text-gray-800 shadow-sm">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-gray-900">
                  Quote Reference No. at academy reception
                </div>
                <div className="text-[9px] text-gray-500">
                  No QR code or paper ticket required for trial check-in
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const refNo = bookingId;
                  navigator.clipboard.writeText(refNo);
                  showToast(`📋 Copied reference ${refNo}!`);
                }}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Copy size={12} weight="bold" />
                <span>Copy Ref</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const refNo = bookingId;
                const selectedBatch = batchesList.find((b: any) => b.id === selectedBatchId) || batchesList[0];
                downloadBookingSlip({
                  bookingId: refNo,
                  referenceNo: refNo,
                  type: 'trial',
                  academyName: acadName,
                  studentName: selectedChildNames.join(', '),
                  parentName: session?.user?.name || 'Parent',
                  parentPhone: session?.user?.email || '',
                  schedule: `${selectedDate || 'Upcoming'} • ${selectedSlot || selectedBatch?.pureSchedule || selectedBatch?.schedule || selectedBatch?.time || 'Scheduled Timing'}`,
                  courtOrVenue: selectedBatch?.name || 'Complimentary Trial Batch',
                  paymentStatus: 'CONFIRMED FREE TRIAL',
                  dateBooked: new Date().toLocaleDateString('en-IN'),
                });
                showToast('📄 Opening official Free Trial Pass (PDF)...');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download Free Trial Pass (PDF)</span>
            </button>

            <div className="flex gap-2">
              <Link
                href="/parent/bookings"
                onClick={handleClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1"
              >
                <span>View in My Bookings</span>
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogWrapper>
  );
}
