"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { signIn } from 'next-auth/react';
import { usePersona } from '@/context/PersonaContext';
import { registerCoachAcademy, getTaxonomyCategories } from '@/lib/actions';
import {
  ShieldCheck,
  CheckCircle,
  Buildings,
  User,
  EnvelopeSimple,
  Phone,
  MapPin,
  LockKey,
  Eye,
  EyeSlash,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  Star,
  Trophy,
  WarningCircle,
  CurrencyInr,
  Users,
  FileArrowUp,
  Image as ImageIcon,
  Check,
  Clock,
  Trash,
  Plus,
  X,
} from '@phosphor-icons/react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { MultiCategorySelector } from '@/components/ui/MultiCategorySelector';
import { getCategoryEmoji, getCategoryDisplayName } from '@/lib/categories';

const ACADEMY_CATEGORIES = [
  { id: 'tennis', label: '🎾 Tennis Academy' },
  { id: 'badminton', label: '🏸 Badminton Academy' },
  { id: 'cricket', label: '🏏 Cricket Academy' },
  { id: 'swimming', label: '🏊 Swimming Club' },
  { id: 'football', label: '⚽ Football Academy' },
  { id: 'martial-arts', label: '🥋 Martial Arts / Karate' },
  { id: 'chess', label: '♟️ Chess Institute' },
  { id: 'gymnastics', label: '🤸 Gymnastics Centre' },
  { id: 'skating', label: '🛼 Roller Skating' },
  { id: 'dance', label: '💃 Dance & Performing Arts' },
  { id: 'music', label: '🎵 Music School' },
  { id: 'art-craft', label: '🎨 Art & Creative Studio' },
];

const WIZARD_STEPS = [
  { step: 1, title: 'Academy Profile', shortTitle: 'Profile', icon: Buildings },
  { step: 2, title: 'Contact & Security', shortTitle: 'Account', icon: LockKey },
  { step: 3, title: 'Documents & Safety', shortTitle: 'Documents', icon: FileArrowUp },
  { step: 4, title: 'Review Application', shortTitle: 'Review', icon: CheckCircle },
  { step: 5, title: 'Email Verification', shortTitle: 'Verify', icon: ShieldCheck },
];

export default function RegisterCoachPage() {
  const router = useRouter();
  const { showToast } = usePersona();

  // Wizard Step (1: Academy, 2: Credentials, 3: Verification Docs, 4: Review, 5: OTP Verify)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  // File Input Refs
  const govIdFileRef = useRef<HTMLInputElement>(null);
  const nisCertFileRef = useRef<HTMLInputElement>(null);
  const venuePhotosFileRef = useRef<HTMLInputElement>(null);

  // Step 1: Academy Fields
  const [acadName, setAcadName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['badminton']);
  const category = selectedCategories[0] || 'badminton';
  const [taxonomy, setTaxonomy] = useState<any[]>([]);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [founder, setFounder] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('Agra');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Multi-Category selection toggle helper
  const handleToggleCategory = (catSlug: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catSlug)) {
        if (prev.length <= 1) {
          showToast('⚠️ Please keep at least one activity selected.');
          return prev;
        }
        return prev.filter((c) => c !== catSlug);
      }
      return [...prev, catSlug];
    });
  };

  // Step 2: Contact & Credentials
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Verification & Safety Checklist
  const [docGovIdName, setDocGovIdName] = useState('');
  const [docGovIdNumber, setDocGovIdNumber] = useState('');
  const [docGovIdUrl, setDocGovIdUrl] = useState('');
  const [docNisCertName, setDocNisCertName] = useState('');
  const [docNisCertUrl, setDocNisCertUrl] = useState('');
  const [venuePhotos, setVenuePhotos] = useState<string[]>([]);
  const [safetyChecklist, setSafetyChecklist] = useState({
    cctvMonitored: true,
    nisCertified: true,
    firstAidAvailable: true,
    policeVerifiedStaff: false,
  });

  // Step 4: Terms & Conditions
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        setTaxonomyError(null);
        const data = await getTaxonomyCategories();
        if (data && data.length > 0) {
          setTaxonomy(data);
        } else {
          setTaxonomy([]);
        }
      } catch (err: any) {
        console.error('[DB_ERROR] Failed to load taxonomy categories in register-coach:', err);
        setTaxonomyError(err?.message || 'Database error: Failed to load activity categories.');
        setTaxonomy([]);
      }
    }
    loadTaxonomy();
  }, []);

  const compressFileToDataUrl = (file: File, maxDim = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((event.target?.result as string) || '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = (event.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleGovIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocGovIdName(file.name);
      const dataUrl = await compressFileToDataUrl(file);
      if (dataUrl) setDocGovIdUrl(dataUrl);
      showToast(`📎 Govt ID file attached: ${file.name}`);
    }
  };

  const handleNisCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocNisCertName(file.name);
      const dataUrl = await compressFileToDataUrl(file);
      if (dataUrl) setDocNisCertUrl(dataUrl);
      showToast(`📎 Coaching certificate attached: ${file.name}`);
    }
  };

  const handleVenuePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const compressedList = await Promise.all(
        Array.from(files).map((file) => compressFileToDataUrl(file))
      );
      setVenuePhotos((prev) => [...prev, ...compressedList.filter(Boolean)]);
      showToast(`📸 Added ${files.length} venue photo(s)`);
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'acadName':
        if (!value.trim()) return 'Academy name is required';
        if (value.trim().length < 3) return 'Please enter complete academy name (min 3 chars)';
        return '';
      case 'founder':
        if (!value.trim()) return 'Head coach / founder name is required';
        return '';
      case 'locality':
        if (!value.trim()) return 'Academy locality / area in Agra is required';
        return '';
      case 'pincode':
        if (!value.trim()) return 'Postal PIN code is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Please enter a valid 6-digit Indian PIN code';
        return '';
      case 'address':
        if (!value.trim()) return 'Complete street address is required for parent directions';
        return '';
      case 'email':
        if (!value.trim()) return 'Official contact email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'WhatsApp business number is required';
        if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Enter a valid 10-digit Indian mobile number';
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

  const validateStep = (step: number): boolean => {
    let stepErrors: Record<string, string> = {};

    if (step === 1) {
      stepErrors = {
        acadName: validateField('acadName', acadName),
        founder: validateField('founder', founder),
        locality: validateField('locality', locality),
        pincode: validateField('pincode', pincode),
        address: validateField('address', address),
      };
      setTouched((prev) => ({ ...prev, acadName: true, founder: true, locality: true, pincode: true, address: true }));
    } else if (step === 2) {
      stepErrors = {
        email: validateField('email', email),
        phone: validateField('phone', phone),
        password: validateField('password', password),
        confirmPassword: validateField('confirmPassword', confirmPassword),
      };
      setTouched((prev) => ({ ...prev, email: true, phone: true, password: true, confirmPassword: true }));
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    const hasError = Object.values(stepErrors).some(Boolean);

    if (hasError) {
      const firstKey = Object.keys(stepErrors).find((k) => Boolean(stepErrors[k]));
      if (firstKey) {
        setTimeout(() => {
          const el = document.getElementById(firstKey);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
      setFormError('Please fill out all mandatory fields before continuing.');
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 4) {
      handleInitiateOtp();
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4 -> 5: Dispatch Email OTP
  const handleInitiateOtp = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      showToast('⚠️ Please correct highlighted errors before continuing.');
      return;
    }

    if (!agreedToTerms) {
      setFormError('Please accept the coach terms and safety standards to proceed.');
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
          role: 'COACH',
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

      // Transition to Step 5
      setCurrentStep(5);
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
      console.error('Error sending coach registration OTP:', err);
      setFormError('Network error while requesting verification code. Please check your connection.');
      showToast('⚠️ Network error. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP on Step 5
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
          role: 'COACH',
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

  // Step 5: Verify OTP & Complete Registration Atomically
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

    try {
      localStorage.setItem(
        'kuc_user_location',
        JSON.stringify({
          locality: locality.trim(),
          pincode: pincode.trim(),
          city: city.trim() || 'Agra',
          coords: latitude && longitude ? { lat: latitude, lon: longitude } : undefined,
        })
      );
    } catch (err) {
      console.warn('Could not save location to localStorage', err);
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await registerCoachAcademy({
        acadName: acadName.trim(),
        founder: founder.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        category: selectedCategories.join(','),
        categories: selectedCategories,
        locality: locality.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        city: city.trim() || 'Agra',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        password: password.trim(),
        otp: enteredOtp,
        docs: {
          govIdDocName: docGovIdName || undefined,
          govIdNumber: docGovIdNumber.trim() || undefined,
          govIdUrl: docGovIdUrl || undefined,
          nisCertDocName: docNisCertName || undefined,
          nisCertUrl: docNisCertUrl || undefined,
          venuePhotoNames: venuePhotos,
        },
        safetyChecklist,
      });

      if (!res.success) {
        setOtpError(res.message || 'Verification could not be completed.');
        showToast('⚠️ ' + (res.message || 'Verification failed'));
        setIsSubmitting(false);
        return;
      }

      // Auto sign-in with credentials upon successful verification
      let signInOk = false;
      try {
        const signRes = await signIn('credentials', {
          email: cleanEmail,
          password: password.trim(),
          role: 'COACH',
          redirect: false,
        });
        signInOk = Boolean(signRes && !signRes.error);
      } catch (signInErr) {
        console.warn('Auto sign-in notice:', signInErr);
      }

      setIsSubmitted(true);
      showToast('🎉 Email verified! Opening coach dashboard...');

      if (signInOk) {
        setTimeout(() => {
          window.location.href = '/coach/dashboard';
        }, 1200);
      } else {
        setTimeout(() => {
          window.location.href = `/login?role=coach&registered=1&email=${encodeURIComponent(cleanEmail)}`;
        }, 1400);
      }
    } catch (err) {
      console.error('Coach academy registration error:', err);
      setOtpError('An unexpected network error occurred. Please verify your connection and try again.');
      showToast('⚠️ Registration error. Please check your details and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Mobile Bar */}
      <header className="lg:hidden w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo size="sm" />
        <Link
          href="/login?role=coach"
          className="text-xs font-bold text-slate-700 hover:text-[#0066ff] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
        >
          Coach Login
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* ══════════════════════════════════════════
              LEFT PANEL — Value Proposition & Steps
             ══════════════════════════════════════════ */}
          <aside className="w-full lg:w-[380px] lg:shrink-0 space-y-6 lg:sticky lg:top-8">
            <div className="hidden lg:block">
              <BrandLogo size="lg" />
            </div>

            {/* Hero Card */}
            <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-white border border-blue-200 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#0066ff] shadow-2xs">
                <Buildings size={14} weight="fill" />
                Academy Partner Network
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                List Your Academy in <span className="text-[#0066ff]">Agra</span>
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Connect with 1,400+ parents seeking verified sports and activities coaching. Complete your registration, upload digital verification documents, and verify your email in 5 simple steps.
              </p>

              {/* Subscription Notice Badge */}
              <div className="bg-white/90 rounded-2xl p-3 border border-blue-200 text-xs text-blue-900 font-bold flex items-center gap-2">
                <ShieldCheck size={18} weight="fill" className="text-[#0066ff] shrink-0" />
                <span>Standard &amp; Premier Plans • Publish Verified Academy Listing</span>
              </div>
            </div>

            {/* Multi-Step Guide in Left Panel */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3 hidden sm:block">
              <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Application Progress
              </div>
              <div className="space-y-2.5">
                {WIZARD_STEPS.map(({ step, title, icon: Icon }) => {
                  const isDone = currentStep > step;
                  const isCurrent = currentStep === step;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-all ${isCurrent
                        ? 'bg-blue-50 text-[#0066ff] border border-blue-200'
                        : isDone
                          ? 'text-emerald-700 bg-emerald-50/60'
                          : 'text-slate-400'
                        }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${isDone
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
          </aside>

          {/* ══════════════════════════════════════════
              RIGHT PANEL — 5-STEP ONBOARDING WIZARD
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
                        {currentStep === 1 && '1. Academy Profile & Location'}
                        {currentStep === 2 && '2. Contact & Account Security'}
                        {currentStep === 3 && '3. Verification Documents & Safety'}
                        {currentStep === 4 && '4. Review & Confirm Application'}
                        {currentStep === 5 && '5. Email Security & OTP Verification'}
                      </h2>
                    </div>
                    <span className="bg-blue-100 text-[#0066ff] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-200 shrink-0">
                      Step {currentStep}/{WIZARD_STEPS.length}
                    </span>
                  </div>

                  {/* Horizontal Stepper Dots */}
                  <div className="grid grid-cols-5 gap-2">
                    {WIZARD_STEPS.map(({ step, shortTitle }) => (
                      <div key={step} className="space-y-1">
                        <div
                          className={`h-2 rounded-full transition-all ${currentStep >= step ? 'bg-[#0066ff]' : 'bg-slate-200'
                            }`}
                        />
                        <span
                          className={`text-[10px] font-bold block truncate text-center ${currentStep === step
                            ? 'text-[#0066ff] font-extrabold'
                            : currentStep > step
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                            }`}
                        >
                          {shortTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (currentStep === 4) handleInitiateOtp();
                    else if (currentStep === 5) handleVerifyAndSubmit();
                    else handleNextStep();
                  }}
                  noValidate
                  className="p-6 sm:p-8 space-y-6"
                >
                  {/* Hidden File Inputs for Step 3 */}
                  <input
                    type="file"
                    ref={govIdFileRef}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleGovIdUpload}
                  />
                  <input
                    type="file"
                    ref={nisCertFileRef}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleNisCertUpload}
                  />
                  <input
                    type="file"
                    ref={venuePhotosFileRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleVenuePhotosUpload}
                  />

                  {/* ──────────────────────────────────────────────────────────
                      STEP 1: ACADEMY PROFILE & LOCATION
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Academy / Institute Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Buildings size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              id="acadName"
                              type="text"
                              required
                              value={acadName}
                              onChange={(e) => {
                                setAcadName(e.target.value);
                                if (touched.acadName) handleBlur('acadName', e.target.value);
                              }}
                              onBlur={(e) => handleBlur('acadName', e.target.value)}
                              placeholder="e.g. Ace Sports Academy"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.acadName && touched.acadName
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                          </div>
                          {errors.acadName && touched.acadName && (
                            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                              <WarningCircle size={13} weight="fill" /> {errors.acadName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Founder / Head Coach Full Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              id="founder"
                              type="text"
                              required
                              value={founder}
                              onChange={(e) => {
                                setFounder(e.target.value);
                                if (touched.founder) handleBlur('founder', e.target.value);
                              }}
                              onBlur={(e) => handleBlur('founder', e.target.value)}
                              placeholder="e.g. Coach Rajesh Verma (NIS Certified)"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.founder && touched.founder
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                          </div>
                          {errors.founder && touched.founder && (
                            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                              <WarningCircle size={13} weight="fill" /> {errors.founder}
                            </p>
                          )}
                        </div>
                      </div>

                      {taxonomyError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                          {taxonomyError}
                        </div>
                      )}

                      {/* Multi-Activity / Category 2-Dropdown Cascading Selector */}
                      <MultiCategorySelector
                        selectedCategories={selectedCategories}
                        onChange={setSelectedCategories}
                        taxonomy={taxonomy}
                        theme="blue"
                        minRequired={1}
                        label="Activities & Disciplines Offered"
                        sublabel="Select coaching programs. Use Dropdown 1 to choose a main activity pillar, and Dropdown 2 to add or remove linked categories."
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2" id="locality">
                          <AddressAutocomplete
                            label="Neighborhood / Locality in Agra *"
                            placeholder="Search area (e.g. Kamla Nagar, DayalBagh, Indiranagar)..."
                            value={locality}
                            required
                            onChange={(val, details) => {
                              setLocality(details?.locality || val);
                              if (details?.city) setCity(details.city);
                              if (details?.postcode && !pincode) setPincode(details.postcode);
                              if (details?.lat && details?.lon) {
                                setLatitude(details.lat);
                                setLongitude(details.lon);
                              }
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
                              className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.pincode && touched.pincode
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
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

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Complete Street Address & Landmark <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="address"
                          type="text"
                          required
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (touched.address) handleBlur('address', e.target.value);
                          }}
                          onBlur={(e) => handleBlur('address', e.target.value)}
                          placeholder="e.g. Plot 42, Near St. Conrad's College, Bypass Road, Kamla Nagar"
                          className={`w-full bg-white border rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.address && touched.address
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                            }`}
                        />
                        {errors.address && touched.address && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" /> {errors.address}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      STEP 2: CONTACT & CREDENTIALS
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Official Contact Email <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <EnvelopeSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              id="email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (touched.email) handleBlur('email', e.target.value);
                              }}
                              onBlur={(e) => handleBlur('email', e.target.value)}
                              placeholder="e.g. coach@acesports.in"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.email && touched.email
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
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
                            WhatsApp Business Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              id="phone"
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => {
                                let clean = e.target.value.replace(/\D/g, '');
                                if (clean.length === 12 && clean.startsWith('91')) clean = clean.slice(2);
                                if (clean.length === 11 && clean.startsWith('0')) clean = clean.slice(1);
                                if (clean.length > 10) clean = clean.slice(0, 10);
                                setPhone(clean);
                                if (touched.phone) handleBlur('phone', clean);
                              }}
                              onBlur={(e) => handleBlur('phone', e.target.value)}
                              placeholder="10-digit mobile (e.g. 9897012345)"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none transition-all ${errors.phone && touched.phone
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Account Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <LockKey size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              id="password"
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
                              className={`w-full bg-white border rounded-2xl pl-10 pr-11 py-3 text-sm font-medium focus:outline-none transition-all ${errors.password && touched.password
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer min-w-[36px] flex items-center justify-center"
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
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (touched.confirmPassword) handleBlur('confirmPassword', e.target.value);
                              }}
                              onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                              placeholder="Re-enter password"
                              className={`w-full bg-white border rounded-2xl pl-10 pr-11 py-3 text-sm font-medium focus:outline-none transition-all ${errors.confirmPassword && touched.confirmPassword
                                ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 focus:border-[#0066ff] focus:ring-4 focus:ring-blue-500/10'
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer min-w-[36px] flex items-center justify-center"
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
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      STEP 3: VERIFICATION DOCUMENTS & SAFETY CHECKLIST
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
                        <ShieldCheck size={20} weight="fill" className="text-[#0066ff] shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-900 leading-relaxed">
                          <strong>Digital In-App Verification:</strong> Uploading your Government ID and Venue photos now speeds up admin verification so your academy can be approved and published quickly.
                        </div>
                      </div>

                      {/* Document Uploads Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Government ID */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              1. Head Coach Govt ID (Aadhaar / Voter ID)
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${docGovIdName ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                              {docGovIdName ? 'Attached ✓' : 'Recommended'}
                            </span>
                          </div>

                          <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white text-center space-y-1.5">
                            <FileArrowUp
                              size={24}
                              className={`mx-auto ${docGovIdName ? 'text-emerald-600' : 'text-slate-400'}`}
                            />
                            {docGovIdName ? (
                              <>
                                <div className="text-xs font-bold text-slate-800 truncate">{docGovIdName}</div>
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => govIdFileRef.current?.click()}
                                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Replace File
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDocGovIdName('');
                                      setDocGovIdUrl('');
                                    }}
                                    className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-slate-500">Attach Aadhaar / Voter ID file</div>
                                <button
                                  type="button"
                                  onClick={() => govIdFileRef.current?.click()}
                                  className="bg-blue-50 hover:bg-blue-100 text-[#0066ff] font-extrabold text-xs px-3 py-1 rounded-xl transition-all cursor-pointer"
                                >
                                  Browse File
                                </button>
                              </>
                            )}
                          </div>

                          <input
                            type="text"
                            value={docGovIdNumber}
                            onChange={(e) => setDocGovIdNumber(e.target.value)}
                            placeholder="Optional: ID Number (e.g. 12-digit Aadhaar)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#0066ff]"
                          />
                        </div>

                        {/* 2. Coaching License / NIS Certificate */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              2. Coaching License / NIS Diploma
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${docNisCertName ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                              {docNisCertName ? 'Attached ✓' : 'Optional'}
                            </span>
                          </div>

                          <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white text-center space-y-1.5">
                            <FileArrowUp
                              size={24}
                              className={`mx-auto ${docNisCertName ? 'text-emerald-600' : 'text-slate-400'}`}
                            />
                            {docNisCertName ? (
                              <>
                                <div className="text-xs font-bold text-slate-800 truncate">{docNisCertName}</div>
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => nisCertFileRef.current?.click()}
                                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Replace File
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDocNisCertName('');
                                      setDocNisCertUrl('');
                                    }}
                                    className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-slate-500">Attach Diploma / Certification scan</div>
                                <button
                                  type="button"
                                  onClick={() => nisCertFileRef.current?.click()}
                                  className="bg-blue-50 hover:bg-blue-100 text-[#0066ff] font-extrabold text-xs px-3 py-1 rounded-xl transition-all cursor-pointer"
                                >
                                  Browse File
                                </button>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">NIS Patiala, SAI, or recognized State Sports Association.</p>
                        </div>
                      </div>

                      {/* 3. Venue & Facility Photos */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              3. Venue & Facility Photos (Courts, Playing Area, Safety)
                            </span>
                            <p className="text-[11px] text-slate-500">Upload photos of your courts, practice nets, or equipment</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => venuePhotosFileRef.current?.click()}
                            className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <FileArrowUp size={14} weight="bold" /> Upload Photos
                          </button>
                        </div>

                        {venuePhotos.length === 0 ? (
                          <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-white text-center space-y-1">
                            <ImageIcon size={24} className="mx-auto text-slate-400" />
                            <div className="text-xs text-slate-500 font-medium">No facility photos attached yet</div>
                            <button
                              type="button"
                              onClick={() => venuePhotosFileRef.current?.click()}
                              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Add photos from device
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {venuePhotos.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative rounded-xl overflow-hidden aspect-video bg-slate-200 border border-slate-300 group"
                              >
                                <img src={url} alt={`Venue photo ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setVenuePhotos(venuePhotos.filter((_, i) => i !== idx))}
                                    className="bg-rose-600 text-white p-1 rounded-lg text-xs cursor-pointer"
                                  >
                                    <Trash size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 4. Safety & Facility Checklist */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800">
                          4. Facility & Safety Checklist
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            { key: 'cctvMonitored', label: '24/7 CCTV Monitored Premises', desc: 'Active security cameras' },
                            { key: 'nisCertified', label: 'Certified / NIS Head Coach', desc: 'Qualified coaching staff' },
                            { key: 'firstAidAvailable', label: 'First-Aid Kit on Premises', desc: 'Emergency medical supplies' },
                            { key: 'policeVerifiedStaff', label: 'Police Verified Staff', desc: 'Staff background checked' },
                          ].map(({ key, label, desc }) => {
                            const isChecked = Boolean((safetyChecklist as any)[key]);
                            return (
                              <label
                                key={key}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${isChecked
                                  ? 'border-blue-300 bg-blue-50/50 text-blue-950 font-bold'
                                  : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    setSafetyChecklist((prev) => ({
                                      ...prev,
                                      [key]: !isChecked,
                                    }))
                                  }
                                  className="mt-0.5 rounded text-[#0066ff] focus:ring-blue-500"
                                />
                                <div>
                                  <div className="text-xs">{label}</div>
                                  <div className="text-[10px] text-slate-500 font-normal">{desc}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      STEP 4: REVIEW & CONFIRM APPLICATION
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Listing Policy Notice */}
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                          <ShieldCheck size={18} weight="fill" className="text-[#0066ff] shrink-0" />
                          <span>Account Registration &amp; Public Listing Policy</span>
                        </div>
                        <p className="text-xs text-blue-900/85 leading-relaxed">
                          Submitting this registration registers your academy account. By default, newly registered academies remain <strong>unlisted from the public directory</strong>. To make your profile publicly visible to parents and receive bookings, purchase either the <strong>Standard Plan</strong> or <strong>Premier Plan</strong> in your dashboard.
                        </p>
                      </div>

                      {/* Application Overview Summary */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                        <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Application Summary
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block font-medium">Academy Name</span>
                            <span className="font-extrabold text-slate-900 text-sm">{acadName || '—'}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block font-medium mb-1">Activities &amp; Disciplines Offered</span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedCategories.map((slug) => (
                                <span
                                  key={slug}
                                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200/90 px-2.5 py-1 rounded-xl text-xs font-bold"
                                >
                                  <span>{getCategoryEmoji(slug)}</span>
                                  <span>{getCategoryDisplayName(slug)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Head Coach / Founder</span>
                            <span className="font-bold text-slate-900">{founder || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Locality & City</span>
                            <span className="font-bold text-slate-900">{locality}, {city}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Postal PIN Code</span>
                            <span className="font-bold text-slate-900">{pincode || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Contact Email</span>
                            <span className="font-bold text-slate-900">{email}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">WhatsApp Phone</span>
                            <span className="font-bold text-slate-900">+91 {phone}</span>
                          </div>
                        </div>

                        {/* Documents & Checklist Summary */}
                        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 font-bold block">Government ID</span>
                            <span className={`text-xs font-extrabold ${docGovIdName ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {docGovIdName ? 'Attached ✓' : 'Pending'}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 font-bold block">Coaching License</span>
                            <span className={`text-xs font-extrabold ${docNisCertName ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {docNisCertName ? 'Attached ✓' : 'Pending'}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 font-bold block">Venue Photos</span>
                            <span className={`text-xs font-extrabold ${venuePhotos.length > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {venuePhotos.length > 0 ? `${venuePhotos.length} Photos ✓` : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Terms Acceptance */}
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed font-medium">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 rounded text-[#0066ff] focus:ring-blue-500 shrink-0"
                        />
                        <span>
                          I agree to the KnowUrCoach{' '}
                          <span className="font-bold text-slate-800">Coach Partner Terms</span>, Child Safety Standards, and submit my application for in-app digital verification.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      STEP 5: EMAIL SECURITY & OTP VERIFICATION
                     ────────────────────────────────────────────────────────── */}
                  {currentStep === 5 && (
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
                              Verify Academy Email Address
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              We sent a 6-digit one-time password (OTP) to{' '}
                              <strong className="text-slate-900 font-extrabold bg-white px-2 py-0.5 rounded-md border border-blue-200 inline-block my-0.5 break-all">
                                {email}
                              </strong>
                              . Please enter the code below to complete account registration.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-blue-100">
                          <span className="text-slate-500 font-medium">Entered incorrect email address?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStep(2);
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
                              className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 transition-all outline-none ${digit
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
                    </div>
                  )}

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
                          href={`/login?role=coach&email=${encodeURIComponent(email.trim())}`}
                          className="shrink-0 bg-[#0066ff] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Sign In to Coach Portal</span>
                          <ArrowRight size={14} weight="bold" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Navigation CTA Controls */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={16} weight="bold" />
                        <span>Previous Step</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <span>Continue to Step {currentStep + 1}</span>
                        <ArrowRight size={16} weight="bold" />
                      </button>
                    ) : currentStep === 4 ? (
                      <button
                        type="button"
                        onClick={handleInitiateOtp}
                        disabled={isSendingOtp || !agreedToTerms}
                        className="bg-[#0066ff] hover:bg-blue-700 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                      >
                        {isSendingOtp ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending Verification Code…</span>
                          </span>
                        ) : (
                          <>
                            <span>Continue to Email Verification</span>
                            <ArrowRight size={16} weight="bold" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyAndSubmit}
                        disabled={isSubmitting || otp.join('').trim().length !== 6}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                      >
                        {isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Verifying &amp; Submitting…</span>
                          </span>
                        ) : (
                          <>
                            <CheckCircle size={18} weight="fill" />
                            <span>Verify Code &amp; Complete Registration</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                {/* Switch to Login Footer */}
                <div className="bg-slate-50/80 px-6 sm:px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
                  Already registered as an Academy?{' '}
                  <Link href="/login?role=coach" className="font-bold text-[#0066ff] hover:underline">
                    Sign in to Coach Portal →
                  </Link>
                </div>
              </div>
            ) : (
              /* Success Confirmation */
              <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-xl space-y-4 animate-fade-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle size={36} weight="fill" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Application Submitted Successfully!</h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your academy profile and verification documents have been received by the compliance desk. Digital review takes 24–48 hours.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 animate-pulse pt-2">
                  <Clock size={16} />
                  <span>Redirecting to your coach dashboard…</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
