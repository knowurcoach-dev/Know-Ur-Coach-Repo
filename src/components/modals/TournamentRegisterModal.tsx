"use client";

import React, { useState, useEffect } from 'react';
import { DialogWrapper } from './DialogWrapper';
import { useModalStore } from '@/hooks/useModalStore';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import {
  registerTournamentEntry,
  getParentDashboardData,
  addChildProfile,
  createTournamentRazorpayOrderAction,
  verifyTournamentPaymentAction,
} from '@/lib/actions';
import { downloadBookingSlip } from '@/lib/downloadBookingSlip';
import {
  Trophy,
  CheckCircle,
  Copy,
  DownloadSimple,
  CalendarBlank,
  Clock,
  User,
  Medal,
  CircleNotch,
  Plus,
  UserPlus,
  Check,
  ShieldCheck,
  LockKey,
  CreditCard,
  Wallet,
  CurrencyInr,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function TournamentRegisterModal() {
  const { isOpen, activeModal, modalData, closeModal } = useModalStore();
  const { showToast } = usePersona();
  const { session, user, isGuest } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildNames, setSelectedChildNames] = useState<string[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'venue'>('razorpay');
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  // Quick Add Child inline state
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  const isModalOpen = isOpen && activeModal === 'competition-register';

  const competition = modalData?.competition || {};
  const compTitle = modalData?.title || competition.title || 'Tournament Championship';
  const compSport = competition.sport || 'Sports Tournament';
  const compVenue = competition.venue || 'Premier Sports Complex';
  const compDate = competition.date || competition.dates || 'Upcoming';
  const compFee = competition.fee !== undefined ? Number(competition.fee) : (competition.registrationFee !== undefined ? Number(competition.registrationFee) : 450);
  const prizePool = competition.prizePool || 'Medals & State Certificates';
  const isFree = compFee === 0;

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    loadRazorpayScript().then(setIsRazorpayReady);
  }, []);

  useEffect(() => {
    if (!isModalOpen || isGuest || !userEmail) return;

    async function fetchChildren() {
      try {
        const res = await getParentDashboardData(userEmail);
        if (res?.children && res.children.length > 0) {
          setChildrenList(res.children);
          if (modalData?.selectedChildNames && Array.isArray(modalData.selectedChildNames) && modalData.selectedChildNames.length > 0) {
            setSelectedChildNames(modalData.selectedChildNames);
          } else {
            setSelectedChildNames([res.children[0].fullName]);
          }
        } else {
          setChildrenList([]);
          setSelectedChildNames([]);
          setShowAddChild(true);
        }
      } catch (err) {
        console.warn('Could not load children in tournament modal:', err);
        setChildrenList([]);
        setSelectedChildNames([]);
      }
    }

    fetchChildren();
  }, [isModalOpen, userEmail, isGuest, modalData]);

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

    if (!userEmail) {
      showToast('⚠️ Please sign in to add a child profile');
      return;
    }

    setAddingChild(true);
    try {
      const res = await addChildProfile(userEmail, {
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 10,
      });

      const newChildObj = res?.child || {
        id: `child-${Date.now()}`,
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 10,
      };

      setChildrenList((prev) => [...prev, newChildObj]);
      setSelectedChildNames((prev) => [...prev, newChildObj.fullName]);
      setNewChildName('');
      setNewChildAge('');
      setShowAddChild(false);
      showToast(`✅ Added ${newChildObj.fullName}! Selected for entry.`);
    } catch {
      showToast('⚠️ Could not save child profile. Selected locally.');
      const localChild = {
        id: `child-${Date.now()}`,
        fullName: newChildName.trim(),
        age: parseInt(newChildAge.trim(), 10) || 10,
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

    if (isGuest || !userEmail) {
      showToast('⚠️ Please sign in or create a parent account to register for tournaments');
      handleClose();
      router.push('/login?callbackUrl=/competitions');
      return;
    }

    if (selectedChildNames.length === 0) {
      showToast('⚠️ Please select or add at least one child participant');
      return;
    }

    // CASE 1: Free Tournament or Pay at Venue selected
    if (isFree || paymentMethod === 'venue') {
      setSubmitting(true);
      try {
        const res = await registerTournamentEntry({
          competitionId: competition.id,
          competitionTitle: compTitle,
          childNames: selectedChildNames,
          childName: selectedChildNames.join(', '),
          parentEmail: userEmail,
          parentName: session?.user?.name || undefined,
          netAmountPaid: 0,
        });

        if (!res.success) {
          showToast(res.message || '⚠️ Tournament registration could not be completed');
          return;
        }

        setBookingId(res.passId || res.bookingId);
        setStep('success');
        showToast(
          isFree
            ? `🏆 Free Entry Pass confirmed for ${selectedChildNames.join(' & ')}!`
            : `🎟️ Entry registered! Please pay ₹${compFee * selectedChildNames.length} at tournament desk on match day.`
        );
      } catch (err) {
        console.error('Tournament registration error:', err);
        showToast('⚠️ Failed to complete tournament registration. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // CASE 2: Paid Tournament via Razorpay
    setSubmitting(true);
    try {
      const orderRes = await createTournamentRazorpayOrderAction({
        competitionId: competition.id,
        childNames: selectedChildNames,
        parentEmail: userEmail,
        parentName: session?.user?.name || undefined,
        parentPhone: (user as any)?.phone || undefined,
      });

      if (!orderRes.success) {
        showToast(orderRes.message || '⚠️ Failed to initiate payment order.');
        setSubmitting(false);
        return;
      }

      if (orderRes.isFree) {
        const res = await registerTournamentEntry({
          competitionId: competition.id,
          competitionTitle: compTitle,
          childNames: selectedChildNames,
          parentEmail: userEmail,
          parentName: session?.user?.name || undefined,
          netAmountPaid: 0,
        });
        setBookingId(res.passId || res.bookingId);
        setStep('success');
        setSubmitting(false);
        return;
      }

      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('⚠️ Razorpay payment SDK could not be loaded. Check your internet connection.');
          setSubmitting(false);
          return;
        }
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amountPaise,
        currency: 'INR',
        name: 'KnowUrCoach Competitions',
        description: `Entry Pass: ${compTitle} (${selectedChildNames.length} Participant${selectedChildNames.length > 1 ? 's' : ''})`,
        order_id: orderRes.orderId,
        prefill: {
          name: session?.user?.name || '',
          email: userEmail,
          contact: (user as any)?.phone || '',
        },
        theme: {
          color: '#ea580c',
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyTournamentPaymentAction({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              competitionId: competition.id,
              childNames: selectedChildNames,
              parentEmail: userEmail,
              parentName: session?.user?.name || undefined,
              parentPhone: (user as any)?.phone || undefined,
            });

            if (verifyRes.success) {
              setBookingId((verifyRes as any).passId || (verifyRes as any).bookingId || '');
              setStep('success');
              showToast(`🏆 Payment Verified! Registration confirmed for ${selectedChildNames.join(' & ')}.`);
            } else {
              showToast(verifyRes.message || 'Payment verification failed.');
            }
          } catch (vErr) {
            console.error('Payment verification error:', vErr);
            showToast('⚠️ Error confirming payment. Please contact coordinator.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            showToast('Payment window was closed.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        showToast(`⚠️ Payment failed: ${resp.error?.description || 'Gateway declined'}`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay tournament launch error:', err);
      showToast('⚠️ Could not open payment checkout. Please retry.');
      setSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <DialogWrapper
      id="tournament-register-modal"
      isOpen={isModalOpen}
      onClose={handleClose}
      icon={<Trophy size={20} weight="fill" />}
      title="Tournament Registration"
      subtitle="Official Entry Pass with Verified Aadhaar / Age Verification"
      headerGradient="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white"
    >
      {isGuest || !userEmail ? (
        /* Guest Access Barrier: Guests must not be allowed to register or see child booking options */
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
            <LockKey size={28} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">Parent Account Required</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Guest users cannot register for official youth championships. Tournament entry passes require verified parent credentials for Aadhaar/age certification and referee check-in.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => {
                handleClose();
                router.push('/login?callbackUrl=/competitions');
              }}
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold text-xs hover:bg-orange-700 shadow-md transition-all cursor-pointer"
            >
              Sign In to Parent Account
            </button>
            <button
              onClick={() => {
                handleClose();
                router.push('/register-parent');
              }}
              className="px-5 py-2.5 rounded-xl border border-orange-200 text-orange-800 font-extrabold text-xs hover:bg-orange-50 transition-all cursor-pointer"
            >
              Create Free Parent Profile
            </button>
          </div>
        </div>
      ) : step === 'form' ? (
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tournament Overview */}
          <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200/80 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-orange-700 uppercase tracking-wider block">
                  {compSport} Championship
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">{compTitle}</div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">{compVenue}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Entry Fee</span>
                <span className="text-base font-black text-orange-700">₹{Number(compFee).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-orange-200/50 flex justify-between text-[11px] text-slate-600">
              <span>📅 {compDate}</span>
              <span className="font-bold text-emerald-700">🏆 {prizePool}</span>
            </div>
          </div>

          {/* Child Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                Select Participant * {selectedChildNames.length > 1 && `(${selectedChildNames.length} Selected)`}
              </label>
              {!showAddChild && (
                <button
                  type="button"
                  onClick={() => setShowAddChild(true)}
                  className="text-orange-600 hover:text-orange-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} weight="bold" /> Add Child
                </button>
              )}
            </div>

            {/* Quick Add Child Inline Form */}
            {showAddChild && (
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-orange-900">
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
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    min="3"
                    max="18"
                    placeholder="Age (Yrs)"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddChild}
                  disabled={addingChild}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {addingChild ? <CircleNotch size={14} className="animate-spin" /> : <Plus size={14} weight="bold" />}
                  Save &amp; Select Child
                </button>
              </div>
            )}

            {/* Children Selection Chips */}
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
                          ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500 text-orange-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
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
                          isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'
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

          {/* Payment Method Selector (Only for paid tournaments) */}
          {!isFree && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                  Payment Method *
                </label>
                <span className="text-xs font-black text-orange-600">
                  Total: ₹{(compFee * Math.max(1, selectedChildNames.length)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'razorpay'
                      ? 'bg-orange-50/80 border-orange-500 ring-1 ring-orange-500 text-orange-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${paymentMethod === 'razorpay' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <CreditCard size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs">Pay Online (Razorpay)</div>
                    <div className="text-[10px] text-slate-500 font-medium">Instant pass • UPI, Cards, NetBanking</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('venue')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    paymentMethod === 'venue'
                      ? 'bg-orange-50/80 border-orange-500 ring-1 ring-orange-500 text-orange-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${paymentMethod === 'venue' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Wallet size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs">Pay at Reporting Desk</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cash / Spot UPI at match-day counter</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Guarantee Note */}
          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={16} weight="fill" />
            </div>
            <div>
              <div className="font-extrabold text-emerald-950 text-xs">Official Registration Guarantee</div>
              <div className="text-[11px] text-emerald-700">
                {isFree
                  ? 'Free official entry pass with instant verification QR code for match-day check-in.'
                  : paymentMethod === 'razorpay'
                  ? '100% Escrow protected via Razorpay. Instant verified digital QR pass issued to WhatsApp.'
                  : 'Pay fee at match-day reporting counter to collect your tournament credentials.'}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            {submitting ? (
              <>
                <CircleNotch size={16} weight="bold" className="animate-spin" /> Processing Entry Pass...
              </>
            ) : isFree ? (
              <>
                <CheckCircle size={16} weight="bold" /> Book Free Entry Pass
              </>
            ) : paymentMethod === 'razorpay' ? (
              <>
                <CreditCard size={16} weight="bold" /> Pay ₹{(compFee * Math.max(1, selectedChildNames.length)).toLocaleString('en-IN')} via Razorpay
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" /> Confirm Registration (Pay at Venue)
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: Tournament Confirmation */
        <div className="p-5 space-y-4 text-xs text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-1 animate-bounce shadow-sm">
            <CheckCircle size={36} weight="fill" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#0a1128]">Registration Confirmed!</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Official tournament entry reference is generated below. Available in your parent dashboard.
            </p>
          </div>

          {/* Official Tournament Entry Card */}
          <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white rounded-3xl p-5 shadow-xl text-left relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                  TOURNAMENT ENTRY CONFIRMATION
                </div>
                <div className="font-extrabold text-base mt-0.5">{compTitle}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider">
                ENTRY CONFIRMED
              </div>
            </div>

            <div className="border-t border-dashed border-white/30 my-2.5" />

            <div className="grid grid-cols-2 gap-2.5 text-[10px] mb-3.5">
              <div>
                <div className="text-white/70 font-medium">Participant</div>
                <div className="font-bold text-white text-xs">{selectedChildNames.join(', ')}</div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Reference Number</div>
                <div className="font-mono font-bold text-amber-200 text-xs">
                  {bookingId.startsWith('REF-') ? bookingId : bookingId.replace('KUC-PASS-', 'REF-')}
                </div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Venue</div>
                <div className="font-bold text-white truncate">{compVenue}</div>
              </div>
              <div>
                <div className="text-white/70 font-medium">Reporting</div>
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle size={12} weight="fill" /> 8:30 AM Sharp
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl flex items-center justify-between text-gray-800 shadow-sm">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-gray-900">
                  Quote Reference No. at tournament desk
                </div>
                <div className="text-[9px] text-gray-500">
                  No QR code needed. Reporting officer verifies your entry reference.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const refNo = bookingId.startsWith('REF-') ? bookingId : bookingId.replace('KUC-PASS-', 'REF-');
                  navigator.clipboard.writeText(refNo);
                  showToast(`📋 Copied reference ${refNo}!`);
                }}
                className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
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
                const refNo = bookingId.startsWith('REF-') ? bookingId : bookingId.replace('KUC-PASS-', 'REF-');
                downloadBookingSlip({
                  bookingId: refNo,
                  referenceNo: refNo,
                  type: 'tournament',
                  academyName: compTitle,
                  studentName: selectedChildNames.join(', '),
                  parentName: session?.user?.name || 'Parent',
                  parentPhone: session?.user?.email || '',
                  schedule: 'Tournament Reporting: 8:30 AM Sharp',
                  courtOrVenue: compVenue,
                  feeInfo: 'Tournament Entry Confirmed',
                  paymentStatus: 'Direct Organizer Settlement',
                  dateBooked: new Date().toLocaleDateString('en-IN'),
                });
                showToast('📄 Opening printable tournament entry slip...');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download Entry Slip (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-[#0a1128] hover:bg-gray-900 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </DialogWrapper>
  );
}
