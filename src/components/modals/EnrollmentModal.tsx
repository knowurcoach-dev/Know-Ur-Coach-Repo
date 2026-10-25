"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { enrollMonthlyBatch, getParentDashboardData, addChildProfile, getBatchesForCentre } from '@/lib/actions';
import { getCategoryDisplayName, getCategoryEmoji } from '@/lib/categories';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  CalendarPlus,
  CheckCircle,
  Copy,
  DownloadSimple,
  Clock,
  User,
  ShieldCheck,
  CircleNotch,
  Plus,
  UserPlus,
  Check,
  Buildings,
  Lock,
  LockKey,
} from '@phosphor-icons/react';

export function EnrollmentModal() {
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();
  const { showToast } = usePersona();
  const { session, user, isGuest } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildNames, setSelectedChildNames] = useState<string[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [isExistingPass, setIsExistingPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Child inline state
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  const isModalOpen = isOpen && activeModal === 'batch-booking';

  const academy = modalData?.academy || {};
  const acadName = modalData?.acadName || academy.name || 'Selected Academy';
  const acadLocality = modalData?.locality || academy.localityName || academy.locality || 'Agra';
  const acadCategory = modalData?.category || academy.category || 'Sports Coaching';

  // Batches from academy data or modalData
  const initialBatches = academy.batches && academy.batches.length > 0
    ? academy.batches
    : (modalData?.batches || []);
  const [batchesList, setBatchesList] = useState<any[]>(initialBatches);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const currentBatch = batchesList.find((b: any) => b.id === selectedBatchId) || batchesList[0];
  const dynamicMonthlyFee = currentBatch?.monthlyFee
    ? Number(currentBatch.monthlyFee)
    : (currentBatch?.fee
      ? Number(currentBatch.fee)
      : (Number(academy.fee) || Number(academy.monthlyTuitionFee) || 1800));

  const userEmail = session?.user?.email || (user as any)?.email;

  // Load batches dynamically if missing when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    const directBatches = (modalData?.academy?.batches && modalData.academy.batches.length > 0)
      ? modalData.academy.batches
      : (modalData?.batches || []);

    if (directBatches.length > 0) {
      setBatchesList(directBatches);
      const initBatchId = modalData?.selectedBatchId || modalData?.selectedBatch?.id || directBatches[0]?.id || '';
      setSelectedBatchId(initBatchId);
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

  // Load children profiles when modal opens
  useEffect(() => {
    if (!isModalOpen || isGuest || !userEmail) return;

    if (modalData?.selectedBatchId) {
      setSelectedBatchId(modalData.selectedBatchId);
    } else if (batchesList.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batchesList[0].id);
    }

    async function fetchChildren() {
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
        console.warn('Could not load children in batch modal:', err);
        setChildrenList([]);
        setSelectedChildNames([]);
      }
    }

    fetchChildren();
  }, [isModalOpen, userEmail, isGuest, batchesList, selectedBatchId]);

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
      showToast(`✅ Added ${newChildObj.fullName}! Selected for enrollment.`);
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
      showToast('⚠️ Please select at least one child for monthly batch enrollment');
      return;
    }

    const selectedBatch = batchesList.find((b: any) => b.id === selectedBatchId) || batchesList[0];

    setSubmitting(true);
    try {
      const res = await enrollMonthlyBatch({
        centreId: modalData?.acadId || academy.id || 'acad-default',
        centreName: acadName,
        batchId: selectedBatch?.id,
        batchName: selectedBatch?.name,
        childNames: selectedChildNames,
        parentEmail: userEmail || session?.user?.email || undefined,
        parentName: session?.user?.name || (user as any)?.name || undefined,
        parentPhone: (session?.user as any)?.phone || (user as any)?.phone || undefined,
      });

      if (!res.success) {
        showToast(`⚠️ ${res.message || 'Enrollment failed'}`);
        return;
      }

      setBookingId(res.passId || res.bookingId);
      setIsExistingPass(Boolean(res.isExisting));
      setStep('success');

      if (res.isExisting) {
        showToast(`ℹ️ ${res.message}`);
      } else {
        showToast(res.message || `🎉 Monthly Batch enrollment confirmed for ${selectedChildNames.join(' & ')}!`);
      }
    } catch (err: any) {
      console.error('Batch enrollment error:', err);
      showToast(err?.message || 'Failed to complete monthly batch enrollment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <DialogWrapper
      id="batch-enrollment-modal"
      isOpen={isModalOpen}
      onClose={handleClose}
      icon={<CalendarPlus size={20} weight="fill" />}
      title="Enroll in Monthly Batch"
      subtitle="Guaranteed Seat with Direct Academy Settlement"
      headerGradient="bg-gradient-to-r from-slate-900 to-indigo-950 text-white"
    >
      {isGuest || !userEmail ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
            <LockKey size={32} weight="fill" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              Parent Sign-In Required
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Please sign in or create a parent account to enroll in monthly batches, reserve a student seat, and activate payment escrow protection.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                handleClose();
                router.push('/login?callbackUrl=/activities');
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
            >
              Sign In to Parent Account
            </button>
            <button
              onClick={() => {
                handleClose();
                router.push('/register-parent');
              }}
              className="px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-800 font-extrabold text-xs hover:bg-indigo-50 transition-all cursor-pointer"
            >
              Create Free Parent Profile
            </button>
          </div>
        </div>
      ) : loadingBatches ? (
        <div className="p-8 text-center space-y-3">
          <CircleNotch size={32} className="animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Checking available coaching batches...</p>
        </div>
      ) : batchesList.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock size={28} weight="bold" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Batches Not Configured Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            This academy does not have open public coaching batches available for enrollment right now. You can book a Free Trial or contact the coach directly.
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Coaching / Academy Selected Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                  Selected Academy
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">{acadName}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {acadLocality}, Agra • {acadCategory}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Monthly Fee</span>
                <span className="text-base font-black text-slate-900">₹{Number(dynamicMonthlyFee).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-400">/mo</span></span>
              </div>
            </div>
          </div>

          {/* 2. Batch Selected Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
              Select Batch &amp; Schedule *
            </label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {batchesList.map((batch: any) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} {batch.category ? `• ${getCategoryEmoji(batch.category)} ${getCategoryDisplayName(batch.category)}` : ''} {batch.pureSchedule || batch.schedule ? `(${batch.pureSchedule || batch.schedule})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {currentBatch?.schedule && (
              <p className="text-[11px] text-slate-500 font-medium">
                Days: <span className="text-slate-800 font-bold">{currentBatch.schedule}</span>
              </p>
            )}
          </div>

          {/* 3. Child Selected Dropdown & Multi-Select with Quick Add */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
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
                <p className="text-gray-500 text-[11px]">No child profile added yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddChild(true)}
                  className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} weight="bold" /> Add Child Now
                </button>
              </div>
            )}

            {/* Children Selection Chips / Cards */}
            {childrenList.length > 0 && (
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
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {child.fullName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-extrabold text-xs truncate">{child.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Age {child.age} yrs</div>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check size={10} weight="bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Direct Academy Settlement Callout */}
          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Lock size={16} weight="fill" />
            </div>
            <div>
              <div className="font-extrabold text-emerald-950 text-xs">Direct Academy Fee Settlement</div>
              <div className="text-[11px] text-emerald-700">No online payment required on booking. Inspect academy facilities and pay tuition directly to the coach offline at the venue.</div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            {submitting ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" /> Confirming Monthly Enrollment...
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" /> Confirm Batch Enrollment
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: Enrollment Success Pass */
        <div className="p-5 space-y-4 text-xs text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-1 animate-bounce shadow-sm">
            <CheckCircle size={36} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0a1128]">
              {isExistingPass ? 'Active Batch Enrollment Exists!' : 'Enrollment Confirmed!'}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isExistingPass
                ? `Student is already enrolled in a monthly batch at ${acadName}. No duplicate admission was created.`
                : `Welcome to ${acadName}! Your child's monthly batch admission is confirmed.`}
            </p>
          </div>

          {/* Official Monthly Batch Admission Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl text-left relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                  CONFIRMED BATCH ADMISSION
                </div>
                <div className="font-extrabold text-base mt-0.5">{acadName}</div>
              </div>
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider">
                MONTHLY BATCH
              </div>
            </div>

            <div className="border-t border-dashed border-white/20 my-2.5" />

            <div className="grid grid-cols-2 gap-2.5 text-[10px] mb-3.5">
              <div>
                <div className="text-white/70 font-medium">Child(ren)</div>
                <div className="font-bold text-white text-xs">{selectedChildNames.join(', ')}</div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Reference Number</div>
                <div className="font-mono font-bold text-emerald-400 text-xs">
                  {bookingId.startsWith('REF-') ? bookingId : bookingId.replace('KUC-PASS-', 'REF-')}
                </div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Batch Selected</div>
                <div className="font-bold text-white truncate">{currentBatch?.name || 'Regular Batch'}</div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Tuition Terms</div>
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck size={12} weight="fill" /> Direct Academy Settlement
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl flex items-center justify-between text-gray-800 shadow-sm">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-gray-900">
                  Quote Reference No. on Day 1 at Academy
                </div>
                <div className="text-[9px] text-gray-500">
                  No QR code needed. Coach verifies via parent phone or reference number.
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
                downloadBookingSlip({
                  bookingId: refNo,
                  referenceNo: refNo,
                  type: 'batch',
                  academyName: acadName,
                  studentName: selectedChildNames.join(', '),
                  parentName: session?.user?.name || 'Parent',
                  parentPhone: session?.user?.email || '',
                  schedule: currentBatch?.pureSchedule || currentBatch?.schedule || currentBatch?.time || 'Regular Weekly Timings',
                  courtOrVenue: currentBatch?.name || 'Monthly Coaching Batch',
                  feeInfo: `₹${Number(dynamicMonthlyFee).toLocaleString('en-IN')}/month`,
                  paymentStatus: 'Direct Academy Settlement',
                  dateBooked: new Date().toLocaleDateString('en-IN'),
                });
                showToast('📄 Opening printable admission slip...');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download Admission Slip (PDF)</span>
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
