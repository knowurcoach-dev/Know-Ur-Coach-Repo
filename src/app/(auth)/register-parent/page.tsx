"use client";

import React, { useState } from 'react';
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

export default function RegisterParentPage() {
  const router = useRouter();
  const { showToast } = usePersona();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    return !Object.values(newErrors).some((msg) => Boolean(msg));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      showToast('⚠️ Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
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
      const res = await registerParentAccount({
        fullName: parentName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        locality: locality.trim(),
        pincode: pincode.trim(),
        city: city.trim() || 'Agra',
        password: password.trim(),
        children: children.map((c) => ({
          name: c.name.trim(),
          age: parseInt(c.age, 10) || 8,
          interests: c.interests,
        })),
      });

      if (!res.success) {
        showToast('⚠️ ' + (res.message || 'Registration failed'));
        setIsSubmitting(false);
        return;
      }

      // Auto sign-in
      try {
        await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: 'PARENT',
          redirect: false,
        });
      } catch (signInErr) {
        console.warn('Parent auto sign-in notice:', signInErr);
      }

      setIsSubmitted(true);
      showToast('🎉 Free Parent Account Created! Zero Platform Fee Guarantee active.');
    } catch (err) {
      console.error('Parent registration error:', err);
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
                {/* Form Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Free Parent Account</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Takes less than 45 seconds • Instant digital access</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                    Free Forever
                  </span>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
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

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !agreedToTerms}
                      className="w-full bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner size={18} className="animate-spin" />
                          <span>Creating Your Free Account...</span>
                        </span>
                      ) : (
                        <>
                          <span>Create Free Parent Account & Get Pass</span>
                          <ArrowRight size={18} weight="bold" />
                        </>
                      )}
                    </button>
                  </div>
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
