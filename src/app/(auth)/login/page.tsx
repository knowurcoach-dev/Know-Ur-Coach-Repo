"use client";

import React, { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeSlash,
  EnvelopeSimple,
  PaperPlaneTilt,
  CheckCircle,
  LockKey,
} from "@phosphor-icons/react";

type Role = "PARENT" | "COACH";

interface RoleOption {
  id: Role;
  emoji: string;
  title: string;
  badge: string;
  subtitle: string;
  color: string;
  badgeBg: string;
  gradient: string;
  border: string;
}

const ROLES: RoleOption[] = [
  {
    id: "PARENT",
    emoji: "👨‍👩‍👧",
    title: "Parent / Guardian",
    badge: "Agra Families",
    subtitle: "Book free trial passes, track batch attendance & enroll in youth tournaments",
    color: "text-violet-700",
    badgeBg: "bg-violet-100 text-violet-700",
    gradient: "from-violet-50 to-purple-50",
    border: "border-violet-200 hover:border-violet-400 hover:shadow-violet-500/10",
  },
  {
    id: "COACH",
    emoji: "🏫",
    title: "Coach / Institute",
    badge: "Academy Partner",
    subtitle: "Manage your academy listing, view parent trial leads & track batch enrollments",
    color: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-700",
    gradient: "from-emerald-50 to-teal-50",
    border: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-500/10",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;

  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Default callback per role
  const getDefaultCallback = (role: Role) => {
    if (role === "PARENT") return "/parent/bookings";
    if (role === "COACH") return "/coach/dashboard";
    return "/";
  };

  useEffect(() => {
    if (step === "form") {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setError(null);
    setEmail("");
    setIsOtpSent(false);
    setOtpNotice(null);
    setOtp("");
    setPassword("");
    setStep("form");
  };

  const handleBack = () => {
    setStep("role");
    setError(null);
    setIsOtpSent(false);
    setOtpNotice(null);
    setOtp("");
    setPassword("");
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    if (!selectedRole) return;

    setError(null);
    setIsSendingOtp(true);
    setOtpNotice(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: selectedRole.id }),
      });
      const data = await res.json();

      if (data.success) {
        setIsOtpSent(true);
        setOtpNotice(
          data.simulated
            ? `Verification code dispatched! (Dev mode: ${data.devOtp || "check server log"})`
            : "6-digit verification code sent to your email via Gmail SMTP."
        );
        setTimeout(() => otpInputRef.current?.focus(), 150);
      } else {
        setError(data.error || "Failed to send verification code. Please try again.");
      }
    } catch {
      setError("Network error while sending OTP. Please check your connection.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: Record<string, string> = {
        email,
        role: selectedRole.id,
      };

      if (authMethod === "otp") {
        if (!otp || otp.length < 6) {
          setError("Please enter the 6-digit verification code sent to your email.");
          setIsLoading(false);
          return;
        }
        credentials.otp = otp;
      } else {
        if (!password) {
          setError("Please enter your password.");
          setIsLoading(false);
          return;
        }
        credentials.password = password;
      }

      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        const destination = callbackUrl || getDefaultCallback(selectedRole.id);
        router.push(destination);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1128] to-slate-900 flex items-center justify-center p-4 py-8">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top Brand Header */}
          <div className="px-6 sm:px-8 pt-8 pb-5 text-center">
            <div className="flex justify-center mb-5">
              <Link
                href="/"
                className="inline-flex items-center justify-center py-2 px-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl shadow-black/25 border border-white/50 hover:bg-white hover:scale-105 transition-all duration-300 group"
              >
                <Image
                  src="/images/brand/logo-full.png"
                  alt="KnowUrCoach - Unlock Growth"
                  width={320}
                  height={109}
                  className="h-12 sm:h-14 w-auto object-contain"
                  unoptimized
                  priority
                />
              </Link>
            </div>

            {step === "role" ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1.5">
                  Sign In to KnowUrCoach
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm font-medium">
                  Choose how you want to sign in:
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2.5">
                  <span className="text-base">{selectedRole?.emoji}</span>
                  <span className="text-xs font-bold text-white">
                    {selectedRole?.title}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                  Email Authentication
                </h1>
                <p className="text-slate-300 text-xs font-medium">
                  Sign in securely with email OTP or password
                </p>
              </>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* ════════════════════════════════════════════
                STEP 1: ROLE SELECTION (Only Parent & Coach)
               ════════════════════════════════════════════ */}
            {step === "role" && (
              <div className="space-y-4">
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full p-5 rounded-2xl border-2 bg-white/95 ${role.border} transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md group relative overflow-hidden`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-3xl flex-shrink-0 shadow-sm`}
                      >
                        {role.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-base sm:text-lg ${role.color}`}>
                            {role.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.badgeBg}`}>
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-snug">
                          {role.subtitle}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors pt-2 border-t border-slate-100">
                          <span>Continue with Email</span>
                          <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New User Links */}
                <div className="flex items-center gap-3 pt-6 pb-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20" />
                  <span className="text-white text-sm font-black tracking-wide drop-shadow-md">✨ New to KnowUrCoach? ✨</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20" />
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/register-parent"
                    className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-600/90 to-purple-800/90 hover:from-violet-500 hover:to-purple-600 border border-violet-400/50 hover:border-violet-300 text-white transition-all duration-300 group cursor-pointer hover:-translate-y-1 shadow-[0_0_15px_-3px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_0px_rgba(139,92,246,0.7)]"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-150" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        👨‍👩‍👧
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-base font-extrabold tracking-wide text-white drop-shadow-sm">Parent Sign Up</span>
                        <span className="text-[11px] text-violet-100 font-bold mt-0.5">Start booking free trials</span>
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-end">
                      <span className="text-xs font-black bg-white text-violet-700 px-3 py-1 rounded-full shadow-md group-hover:shadow-lg transition-shadow">₹0 Free Registration</span>
                      <ArrowRight size={18} weight="bold" className="mt-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>

                  <Link
                    href="/register-coach"
                    className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-800/90 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/50 hover:border-emerald-300 text-white transition-all duration-300 group cursor-pointer hover:-translate-y-1 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_0px_rgba(16,185,129,0.7)]"
                  >
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-full pointer-events-none transition-transform duration-500 group-hover:scale-150" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        🏫
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-base font-extrabold tracking-wide text-white drop-shadow-sm">List Academy</span>
                        <span className="text-[11px] text-emerald-100 font-bold mt-0.5">Grow your enrollments</span>
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-end">
                      <ArrowRight size={18} weight="bold" className="mt-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 2: EMAIL FORM (OTP or Password)
               ════════════════════════════════════════════ */}
            {step === "form" && selectedRole && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <EnvelopeSimple size={18} weight="bold" />
                    </div>
                    <input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRole?.id === 'COACH'
                          ? "Enter official academy email (e.g. academy@example.com)"
                          : "Enter your registered email (e.g. parent@example.com)"
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Authentication Method Tabs */}
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMethod === "password"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("otp");
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMethod === "otp"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Email OTP Code
                  </button>
                </div>

                {/* OTP Method */}
                {authMethod === "otp" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-otp"
                        className="block text-xs font-bold text-slate-200 uppercase tracking-wider"
                      >
                        6-Digit Email Code
                      </label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <span>Sending…</span>
                        ) : (
                          <>
                            <PaperPlaneTilt size={13} weight="bold" />
                            <span>{isOtpSent ? "Resend Code" : "Send OTP to Mail"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="login-otp"
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[12px] font-mono text-xl py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all font-bold"
                      />
                    </div>

                    {otpNotice && (
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-400/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle size={16} weight="fill" className="shrink-0" />
                        <span className="leading-tight">{otpNotice}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Password Method */}
                {authMethod === "password" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="text-xs font-bold text-slate-200 uppercase tracking-wider"
                      >
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-4 pr-11 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeSlash size={18} weight="bold" />
                        ) : (
                          <Eye size={18} weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <span>Sign In as {selectedRole.title.split(' ')[0]}</span>
                      <ArrowRight size={16} weight="bold" />
                    </>
                  )}
                </button>

                {/* Back to Role Selection */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-2 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>Choose a different role</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-slate-400 text-xs font-medium space-x-3">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>•</span>
          <Link href="/activities" className="hover:text-white transition-colors">Discover</Link>
          <span>•</span>
          <Link href="/competitions" className="hover:text-white transition-colors">Tournaments</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  );
}
