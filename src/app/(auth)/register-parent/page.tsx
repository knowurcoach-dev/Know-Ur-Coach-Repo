"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { signIn } from 'next-auth/react';
import { usePersona } from '@/context/PersonaContext';
import { registerParentAccount } from '@/lib/actions';
import {
  ShieldCheck,
  WhatsappLogo,
  Sparkle,
  Gift,
  User,
  Plus,
  Trash,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Question,
  MapPin,
  Phone,
  LockKey,
  Star,
  Trophy,
  SealCheck,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  WarningCircle,
  Spinner,
  Heart,
  Ticket,
  Clock,
  Check,
} from '@phosphor-icons/react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

interface ChildFormState {
  id: string;
  name: string;
  age: string;
  interests: string[];
}

const AVAILABLE_ACTIVITIES = [
  '🏸 Badminton',
  '🎾 Tennis',
  '🏊 Swimming',
  '⚽ Football',
  '♟️ Chess',
  '🥋 Karate',
  '🎨 Painting & Art',
  '💃 Classical Dance',
  '🤖 Robotics & STEM',
  '🏏 Cricket',
];

const TRUST_STATS = [
  { value: '1,400+', label: 'Registered Families' },
  { value: '48+', label: 'Verified Academies' },
  { value: '₹0', label: 'Forever Free' },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: 'NIS certified head coaches & verified venues', color: 'text-emerald-600' },
  { icon: WhatsappLogo, text: 'Instant QR trial passes direct on WhatsApp', color: 'text-emerald-600' },
  { icon: LockKey, text: '100% Escrow protected monthly tuition fee', color: 'text-blue-600' },
  { icon: SealCheck, text: 'Physical safety verified & live CCTV viewing', color: 'text-emerald-600' },
];

const PARENT_TESTIMONIALS = [
  {
    name: 'Priya Agarwal',
    locality: 'Kamla Nagar',
    text: 'Found the best tennis academy for my son in 5 minutes. The free trial booking was seamless!',
    initials: 'PA',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Rahul Gupta',
    locality: 'Sanjay Place',
    text: 'My daughter got a free trial at MasterMind Chess and qualified for her first district championship!',
    initials: 'RG',
    color: 'bg-emerald-100 text-emerald-800',
  },
];

const WIZARD_STEPS = [
  { step: 1, title: 'Parent & Child Profiles', shortTitle: 'Family Details', icon: User },
  { step: 2, title: 'Email Verification', shortTitle: 'Verify Email', icon: ShieldCheck },
];

export default function RegisterParentPage() {
  const router = useRouter();
  const { showToast } = usePersona();

  // Wizard Step (1: Family Details, 2: Email Security & OTP Verification)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Read pre-filled email from URL query if navigated from login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  // Form Fields
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('Agra');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [parentId, setParentId] = useState('');

  // Children
  const [children, setChildren] = useState<ChildFormState[]>([
    { id: 'child-1', name: '', age: '', interests: [] },
  ]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'parentName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Please enter your complete name';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'WhatsApp mobile number is required';
        if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
        return '';
      case 'locality':
        if (!value.trim()) return 'Your neighborhood / locality in Agra is required';
        return '';
      case 'pincode':
        if (!value.trim()) return 'Postal PIN code is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Please enter a valid 6-digit Indian PIN code';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleAddChild = () => {
    const nextNumber = children.length + 1;
    setChildren([
      ...children,
      {
        id: `child-${Date.now()}`,
        name: '',
        age: '',
        interests: [],
      },
    ]);
    showToast(`Child #${nextNumber} added`);
  };

  const handleRemoveChild = (id: string) => {
    if (children.length <= 1) return;
    setChildren(children.filter((c) => c.id !== id));
  };

  const handleToggleInterest = (childId: string, interest: string) => {
    setChildren(
      children.map((c) => {
        if (c.id !== childId) return c;
        const exists = c.interests.includes(interest);
        return {
          ...c,
          interests: exists ? c.interests.filter((i) => i !== interest) : [...c.interests, interest],
        };
      })
    );
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      parentName: validateField('parentName', parentName),
      email: validateField('email', email),
      phone: validateField('phone', phone),
      locality: validateField('locality', locality),
      pincode: validateField('pincode', pincode),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };

    setErrors(newErrors);
    setTouched({
      parentName: true,
      email: true,
      phone: true,
      locality: true,
      pincode: true,
      password: true,
      confirmPassword: true,
    });

    const hasError = Object.values(newErrors).some((msg) => Boolean(msg));
    if (hasError) {
      const firstKey = Object.keys(newErrors).find((k) => Boolean(newErrors[k]));
      if (firstKey) {
        setTimeout(() => {
          const el = document.getElementById(firstKey);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
      return false;
    }

    return true;
  };

  // Step 1 -> Step 2: Request Email OTP Verification Code
  const handleInitiateOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateAll()) {
      showToast('⚠️ Please fill in all required fields correctly.');
      return;
    }

    if (!agreedToTerms) {
      setFormError('Please accept the KnowUrCoach Parent Terms of Service to proceed.');
      return;
    }

    setIsSendingOtp(true);
    setFormError(null);
    setAlreadyExists(false);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          role: 'PARENT',
          isSignup: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to dispatch verification code. Please try again.');
        if (data.alreadyExists) {
          setAlreadyExists(true);
        }
        showToast('⚠️ ' + (data.error || 'Could not send verification code'));
        setIsSendingOtp(false);
        setTimeout(() => {
          document.getElementById('form-error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }

      // Transition to Step 2
      setCurrentStep(2);
      setResendCooldown(30);
      setDevOtpHint(data.devOtp || null);
      setOtp(['', '', '', '', '', '']);
      setOtpError(null);
      showToast(`✉️ 6-digit verification code sent to ${cleanEmail}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Focus first OTP input box after render
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      console.error('Error sending parent registration OTP:', err);
      setFormError('Network error while requesting verification code. Please check your connection.');
      showToast('⚠️ Network error. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP on Step 2
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          role: 'PARENT',
          isSignup: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.error || 'Failed to resend code. Please try again.');
        showToast('⚠️ ' + (data.error || 'Could not resend code'));
        return;
      }

      setResendCooldown(30);
      setDevOtpHint(data.devOtp || null);
      showToast(`✉️ Fresh verification code sent to ${cleanEmail}`);
    } catch (err) {
      setOtpError('Network error while resending verification code.');
      showToast('⚠️ Network error. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP 6-Digit Input Handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleanDigits = val.replace(/\D/g, '');

    // Handle pasting multi-digit string into an individual input
    if (cleanDigits.length > 1) {
      const chars = cleanDigits.slice(0, 6).split('');
      const updatedOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        updatedOtp[i] = chars[i] || '';
      }
      setOtp(updatedOtp);
      setOtpError(null);
      const nextFocus = Math.min(chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = cleanDigits.slice(-1);
    setOtp(updatedOtp);
    setOtpError(null);

    if (cleanDigits && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const updatedOtp = [...otp];
        updatedOtp[index - 1] = '';
        setOtp(updatedOtp);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyAndSubmit();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split('');
    const updatedOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      updatedOtp[i] = chars[i] || '';
    }
    setOtp(updatedOtp);
    setOtpError(null);
    const nextFocus = Math.min(chars.length, 5);
    otpInputRefs.current[nextFocus]?.focus();
  };

  // Step 2: Verify OTP & Complete Parent Registration Atomically
  const handleVerifyAndSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length !== 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      showToast('⚠️ Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setOtpError(null);
    setFormError(null);

    const newParentId = `KUC-PAR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setParentId(newParentId);

    try {
      localStorage.setItem(
        'kuc_user_location',
        JSON.stringify({
          locality: locality.trim(),
          pincode: pincode.trim(),
          city: city.trim() || 'Agra',
        })
      );
    } catch (err) {
      console.warn('Could not save location to localStorage', err);
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await registerParentAccount({
        fullName: parentName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        locality: locality.trim(),
        pincode: pincode.trim(),
        city: city.trim() || 'Agra',
        password: password.trim(),
        otp: enteredOtp,
        children: children.map((c) => ({
          name: c.name.trim(),
          age: parseInt(c.age, 10) || 8,
          interests: c.interests,
        })),
      });

      if (!res.success) {
        setOtpError(res.message || 'Verification could not be completed.');
        showToast('⚠️ ' + (res.message || 'Verification failed'));
        setIsSubmitting(false);
        return;
      }

      // Auto sign-in
      try {
        await signIn('credentials', {
          email: cleanEmail,
          password: password.trim(),
          role: 'PARENT',
          redirect: false,
        });
      } catch (signInErr) {
        console.warn('Parent auto sign-in notice:', signInErr);
      }

      setIsSubmitted(true);
      showToast('🎉 Free Parent Account Created! Email verified successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Parent registration error:', err);
      setOtpError('Registration error. Please check your details and try again.');
      showToast('⚠️ Registration error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Mobile Bar */}
      <header className="lg:hidden w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo size="sm" />
        <Link
          href="/login?role=parent"
          className="text-xs font-bold text-slate-700 hover:text-[#0066ff] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          {/* ══════════════════════════════════════════
              LEFT PANEL — Branding & Social Proof
             ══════════════════════════════════════════ */}
          <aside className="w-full lg:w-[420px] lg:shrink-0 space-y-6 lg:sticky lg:top-8">
            <div className="hidden lg:block">
              <BrandLogo size="lg" />
            </div>

            {/* Pristine Light Hero Showcase */}
            <div className="bg-gradient-to-br from-blue-50/80 via-emerald-50/40 to-white rounded-3xl p-6 sm:p-7 border border-blue-100/90 shadow-sm relative overflow-hidden space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-white border border-blue-200/80 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#0066ff] shadow-xs">
                <Sparkle size={13} weight="fill" className="text-amber-500" />
                100% Free For All Parents
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                Discover Verified <span className="text-[#0066ff]">Kids Academies</span> Across India
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Book zero-fee trial passes, get instant WhatsApp QR vouchers, verify coach NIS credentials, and track your child&apos;s weekly batch progress.
              </p>

              {/* Zero Fee Guarantee Card */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-200/90 shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle size={24} weight="fill" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Zero Parent Fee Guarantee</div>
                  <div className="text-[11px] text-slate-500 font-medium">100% Free Trial Passes for all verified coaching centers</div>
                </div>
              </div>
            </div>

            {/* Multi-Step Guide in Left Panel */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3 hidden sm:block">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Registration Progress
              </div>
              <div className="space-y-2.5">
                {WIZARD_STEPS.map(({ step, title, icon: Icon }) => {
                  const isDone = currentStep > step;
                  const isCurrent = currentStep === step;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-50 text-[#0066ff] border border-blue-200'
                          : isDone
                          ? 'text-emerald-700 bg-emerald-50/60'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#0066ff] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check size={14} weight="bold" /> : step}
                      </span>
                      <span className="flex-1">{title}</span>
                      {isDone && <CheckCircle size={16} weight="fill" className="text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs grid grid-cols-3 gap-2 text-center">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="p-2 bg-slate-50/70 rounded-2xl">
                  <div className="text-lg font-black text-slate-900">{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-bold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trust items */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Parent Assurance Checklist</div>
              {TRUST_ITEMS.map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                  <Icon size={18} weight="fill" className={`${color} shrink-0`} />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="hidden lg:block space-y-3">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">What Parents Say</div>
              {PARENT_TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl ${t.color} font-black text-xs flex items-center justify-center shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{t.locality}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} weight="fill" className="text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic">"{t.text}"</p>
                </div>
              ))}
            </div>
          </aside>

          {/* ══════════════════════════════════════════
              RIGHT PANEL — Parent Registration Form
             ══════════════════════════════════════════ */}
          <div className="flex-1 w-full min-w-0">
            {!isSubmitted ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden">
                {/* Stepper Progress Bar Header */}
                <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                        Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]?.title}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        {currentStep === 1 && '1. Family Details & Child Profiles'}
                        {currentStep === 2 && '2. Email Security & OTP Verification'}
                      </h2>
                    </div>
                    <span className="bg-blue-100 text-[#0066ff] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-200 shrink-0">
                      Step {currentStep}/{WIZARD_STEPS.length}
                    </span>
                  </div>

                  {/* Horizontal Stepper Progress Bar */}
                  <div className="grid grid-cols-2 gap-3">
                    {WIZARD_STEPS.map(({ step, shortTitle }) => (
                      <div key={step} className="space-y-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            currentStep >= step ? 'bg-[#0066ff]' : 'bg-slate-200'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold block truncate text-center ${
                            currentStep === step
                              ? 'text-[#0066ff] font-extrabold'
                              : currentStep > step
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}. {shortTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (currentStep === 1) handleInitiateOtp();
                    else handleVerifyAndSubmit();
                  }}
                  noValidate
                  className="p-6 sm:p-8 space-y-6"
                >
                  {/* ──────────────────────────────────────────────────────────
                      STEP 1: FAMILY DETAILS & CHILD PROFILES
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                  {/* Parent Details Section */}
                  <div className="space-y-4">
                    <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={15} weight="bold" className="text-[#0066ff]" />
                      <span>1. Parent / Guardian Details</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={parentName}
                          onChange={(e) => {
                            setParentName(e.target.value);
                            if (touched.parentName) handleBlur('parentName', e.target.value);
                          }}
                          onBlur={(e) => handleBlur('parentName', e.target.value)}
                          placeholder="e.g. Pooja Sharma"
                          className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm sm:text-base font-medium focus:outline-none transition-all ${
                            errors.parentName && touched.parentName
                              ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                      </div>
                      {errors.parentName && touched.parentName && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <WarningCircle size={13} weight="fill" /> {errors.parentName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <EnvelopeSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (touched.email) handleBlur('email', e.target.value);
                            }}
                            onBlur={(e) => handleBlur('email', e.target.value)}
                            placeholder="e.g. pooja@gmail.com"
                            className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm sm:text-base font-medium focus:outline-none transition-all ${
                              errors.email && touched.email
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          />
                        </div>
                        {errors.email && touched.email && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" /> {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          WhatsApp Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '');
                              setPhone(clean);
                              if (touched.phone) handleBlur('phone', clean);
                            }}
                            onBlur={(e) => handleBlur('phone', e.target.value)}
                            placeholder="10-digit mobile (e.g. 9897012345)"
                            className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm sm:text-base font-medium focus:outline-none transition-all ${
                              errors.phone && touched.phone
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          />
                        </div>
                        {errors.phone && touched.phone && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" /> {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <AddressAutocomplete
                          label="Your Locality / Neighborhood *"
                          placeholder="Search any colony, suburb or landmark (e.g. Kamla Nagar, DayalBagh)..."
                          value={locality}
                          required
                          onChange={(val, details) => {
                            setLocality(details?.locality || val);
                            if (details?.city) setCity(details.city);
                            if (details?.postcode && !pincode) setPincode(details.postcode);
                            if (touched.locality) handleBlur('locality', details?.locality || val);
                          }}
                          helperText={city ? `Detected City: ${city}` : undefined}
                        />
                        {errors.locality && touched.locality && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" /> {errors.locality}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Postal PIN Code <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="pincode"
                            type="text"
                            required
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setPincode(clean);
                              if (touched.pincode) handleBlur('pincode', clean);
                            }}
                            onBlur={(e) => handleBlur('pincode', e.target.value)}
                            placeholder="6-digit PIN (e.g. 282005)"
                            className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${
                              errors.pincode && touched.pincode
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          />
                        </div>
                        {errors.pincode && touched.pincode && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" /> {errors.pincode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                        Account Password Setup
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <LockKey size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (touched.password) handleBlur('password', e.target.value);
                                if (touched.confirmPassword && confirmPassword) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value !== confirmPassword ? 'Passwords do not match' : '',
                                  }));
                                }
                              }}
                              onBlur={(e) => handleBlur('password', e.target.value)}
                              placeholder="Minimum 8 characters"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-11 py-3 text-sm sm:text-base font-medium focus:outline-none transition-all ${
                                errors.password && touched.password
                                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                  : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer min-w-[44px] flex items-center justify-center"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {errors.password && touched.password && (
                            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                              <WarningCircle size={13} weight="fill" /> {errors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Confirm Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <LockKey size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (touched.confirmPassword) handleBlur('confirmPassword', e.target.value);
                              }}
                              onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                              placeholder="Re-enter password"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-11 py-3 text-sm sm:text-base font-medium focus:outline-none transition-all ${
                                errors.confirmPassword && touched.confirmPassword
                                  ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                  : 'border-slate-200/90 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer min-w-[44px] flex items-center justify-center"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {errors.confirmPassword && touched.confirmPassword && (
                            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                              <WarningCircle size={13} weight="fill" /> {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Children Profiles Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>👶 2. Child Profiles ({children.length})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Used for age matching & free trial booking eligibility</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChild}
                        className="flex items-center gap-1.5 text-xs font-extrabold text-[#0066ff] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-blue-200"
                      >
                        <Plus size={15} weight="bold" /> Add Child
                      </button>
                    </div>

                    <div className="space-y-4">
                      {children.map((child, index) => (
                        <div
                          key={child.id}
                          className="bg-slate-50/80 p-4 sm:p-5 rounded-3xl border border-slate-200/80 space-y-4 relative"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-xs font-extrabold text-slate-800">
                                {child.name ? child.name : `Child #${index + 1}`}
                              </span>
                            </div>
                            {children.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveChild(child.id)}
                                className="text-slate-400 hover:text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors p-1"
                              >
                                <Trash size={14} /> Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Child Full Name
                              </label>
                              <input
                                type="text"
                                value={child.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChildren(children.map((c) => (c.id === child.id ? { ...c, name: val } : c)));
                                }}
                                placeholder="e.g. Aarav Sharma"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-blue-500/10"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Age (Years)
                              </label>
                              <select
                                value={child.age}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChildren(children.map((c) => (c.id === child.id ? { ...c, age: val } : c)));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-blue-500/10"
                              >
                                <option value="">Select age...</option>
                                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((age) => (
                                  <option key={age} value={age}>
                                    {age} Years Old
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Interest Chips */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-600">
                              Activity Interests (select all that apply):
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {AVAILABLE_ACTIVITIES.map((interest) => {
                                const selected = child.interests.includes(interest);
                                return (
                                  <button
                                    key={interest}
                                    type="button"
                                    onClick={() => handleToggleInterest(child.id, interest)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                      selected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {interest}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed font-medium">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 rounded text-[#0066ff] focus:ring-blue-500"
                      />
                      <span>
                        I agree to the KnowUrCoach{' '}
                        <span className="font-bold text-slate-800">Parent Terms of Service</span> & Zero Fee Guarantee.
                        Passes are valid for Agra verified partner academies.
                      </span>
                    </label>

                      {/* Persistent Error Banner */}
                      {formError && (
                        <div
                          id="form-error-banner"
                          className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fade-in"
                        >
                          <div className="flex items-center gap-2">
                            <WarningCircle size={20} weight="fill" className="text-rose-600 shrink-0" />
                            <span>{formError}</span>
                          </div>
                          {alreadyExists && (
                            <Link
                              href={`/login?role=parent&email=${encodeURIComponent(email.trim())}`}
                              className="shrink-0 bg-[#0066ff] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>Sign In to Parent Portal</span>
                              <ArrowRight size={14} weight="bold" />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Submit CTA */}
                      <button
                        type="button"
                        onClick={handleInitiateOtp}
                        disabled={isSendingOtp || !agreedToTerms}
                        className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner size={18} className="animate-spin" />
                            <span>Sending Verification Code...</span>
                          </span>
                        ) : (
                          <>
                            <span>Continue to Email Verification</span>
                            <ArrowRight size={18} weight="bold" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                  {/* ──────────────────────────────────────────────────────────
                      STEP 2: EMAIL SECURITY & OTP VERIFICATION
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Security Header Banner */}
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 rounded-2xl p-5 sm:p-6 border border-blue-200 shadow-2xs space-y-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[#0066ff] text-white flex items-center justify-center shrink-0 shadow-md">
                            <EnvelopeSimple size={24} weight="bold" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="inline-flex items-center gap-1.5 bg-blue-100 text-[#0066ff] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                              Two-Factor Verification
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              Verify Parent Email Address
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              We sent a 6-digit one-time password (OTP) to{' '}
                              <strong className="text-slate-900 font-extrabold bg-white px-2 py-0.5 rounded-md border border-blue-200 inline-block my-0.5 break-all">
                                {email}
                              </strong>
                              . Please enter the code below to complete parent account registration.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-blue-100">
                          <span className="text-slate-500 font-medium">Entered incorrect email address?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStep(1);
                              setTimeout(() => {
                                document.getElementById('email')?.focus();
                              }, 50);
                            }}
                            className="text-[#0066ff] hover:text-blue-700 font-bold underline cursor-pointer"
                          >
                            Change Email Address →
                          </button>
                        </div>
                      </div>

                      {/* OTP Digits Input Card */}
                      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                        <div className="text-center space-y-1">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                            Enter 6-Digit Verification Code
                          </label>
                          <p className="text-xs text-slate-500">
                            Code is valid for 10 minutes. Check your inbox and spam folder.
                          </p>
                        </div>

                        {/* 6 Digit Input Boxes */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3.5 max-w-sm mx-auto">
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpInputRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              onPaste={handleOtpPaste}
                              className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 transition-all outline-none ${
                                digit
                                  ? 'border-[#0066ff] bg-blue-50/30 text-blue-900 shadow-sm'
                                  : 'border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-[#0066ff] focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                              } ${otpError ? 'border-rose-400 bg-rose-50/30' : ''}`}
                              placeholder="•"
                              autoComplete="one-time-code"
                            />
                          ))}
                        </div>

                        {/* Dev Mode Simulated OTP Helper */}
                        {devOtpHint && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3 max-w-sm mx-auto">
                            <div className="flex items-center gap-2 font-medium">
                              <Sparkle size={16} className="text-amber-600 shrink-0" weight="fill" />
                              <span>Dev Code: <strong className="font-mono font-black">{devOtpHint}</strong></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const chars = devOtpHint.slice(0, 6).split('');
                                const updated = [...otp];
                                for (let i = 0; i < 6; i++) updated[i] = chars[i] || '';
                                setOtp(updated);
                                setOtpError(null);
                              }}
                              className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                            >
                              Auto-fill
                            </button>
                          </div>
                        )}

                        {/* OTP Specific Error */}
                        {otpError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center justify-center gap-2 animate-fade-in max-w-sm mx-auto">
                            <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
                            <span>{otpError}</span>
                          </div>
                        )}

                        {/* Resend OTP Bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-xs text-slate-600">
                          {resendCooldown > 0 ? (
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                              <Clock size={15} />
                              <span>Resend code in <strong>{resendCooldown}s</strong></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>Didn't receive the email?</span>
                              <button
                                type="button"
                                disabled={isSendingOtp}
                                onClick={handleResendOtp}
                                className="text-[#0066ff] hover:text-blue-700 font-black underline cursor-pointer disabled:opacity-50"
                              >
                                {isSendingOtp ? 'Sending fresh code…' : 'Resend Code Now'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Navigation CTA Controls */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep(1);
                            setOtpError(null);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft size={16} weight="bold" />
                          <span>Previous Step</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVerifyAndSubmit()}
                          disabled={isSubmitting}
                          className="bg-[#0066ff] hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                        >
                          {isSubmitting ? (
                            <span className="inline-flex items-center gap-2">
                              <Spinner size={18} className="animate-spin" />
                              <span>Verifying & Creating Account...</span>
                            </span>
                          ) : (
                            <>
                              <span>Verify & Create Account</span>
                              <CheckCircle size={18} weight="fill" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Switch to Login */}
                <div className="bg-slate-50/80 px-6 sm:px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
                  Already have an account?{' '}
                  <Link href="/login?role=parent" className="font-bold text-[#0066ff] hover:underline">
                    Sign in to Parent Portal →
                  </Link>
                </div>
              </div>
            ) : (
              /* Success Confirmation Card */
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle size={36} weight="fill" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                    <Sparkle size={13} weight="fill" />
                    Account Ready • Zero Fees Active
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Welcome to KnowUrCoach, {parentName}!
                  </h2>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                    Your parent account has been created. Your permanent Parent ID is{' '}
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {parentId}
                    </span>
                    .
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link
                    href="/activities"
                    className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm inline-flex items-center justify-center gap-2"
                  >
                    <span>Explore Agra Academies</span>
                    <ArrowRight size={16} weight="bold" />
                  </Link>
                  <Link
                    href="/parent/bookings"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-6 rounded-2xl transition-all text-sm inline-flex items-center justify-center"
                  >
                    Go to Parent Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Parent Zero Fee Guarantee Active • Verified Agra Network</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/register-coach" className="text-slate-600 hover:text-blue-600">
              Are you a Coach? List Academy →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
