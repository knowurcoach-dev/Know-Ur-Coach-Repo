"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  LockKey,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  ArrowRight,
  Sparkle,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
  Key,
  Buildings,
  ArrowLeft,
} from "@phosphor-icons/react";

function AdminLoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // If already authenticated as an Admin, redirect directly to dashboard
  useEffect(() => {
    if (status === "authenticated" && String((session?.user as any)?.role || "").toUpperCase() === "ADMIN") {
      window.location.href = callbackUrl;
    }
  }, [status, session, callbackUrl]);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid administrator email address.");
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    setOtpNotice(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role: "ADMIN" }),
      });
      const data = await res.json();

      if (data.success) {
        setIsOtpSent(true);
        setOtpNotice("Verification code sent to your admin email via SMTP.");
        setTimeout(() => otpInputRef.current?.focus(), 150);
      } else {
        setError(data.error || "Failed to dispatch admin verification code.");
      }
    } catch {
      setError("Network error while sending OTP. Please check your connection.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setIsLoading(true);

    try {
      const credentials: Record<string, string> = {
        email: email.trim().toLowerCase(),
        role: "ADMIN",
      };

      if (authMethod === "otp") {
        if (!otp || otp.length < 6) {
          setError("Please enter the 6-digit OTP sent to your email.");
          setIsLoading(false);
          return;
        }
        credentials.otp = otp.trim();
      } else {
        if (!password) {
          setError("Please enter your administrator password.");
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
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred during administrative login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-4 py-8 sm:py-12 selection:bg-slate-200">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-100/50 via-slate-100/30 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header Back Button */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-xs transition-all"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Return to Directory</span>
        </Link>
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
          Platform Security Level 4
        </span>
      </div>

      {/* Main Elevated Executive Card */}
      <div className="relative z-10 w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/60 p-6 sm:p-9 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-slate-900/20">
            <ShieldCheck size={28} weight="fill" className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              KnowUrCoach Central Operations & Compliance Gateway
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hardware Isolated • 256-bit TLS Encrypted</span>
          </div>
        </div>


        {/* Auth Method Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700">Authentication Method</span>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setError(null);
              }}
              className={`font-bold pb-1 transition-colors cursor-pointer ${
                authMethod === "password"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Password
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("otp");
                setError(null);
              }}
              className={`font-bold pb-1 transition-colors cursor-pointer ${
                authMethod === "otp"
                  ? "text-slate-900 border-b-2 border-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Admin OTP
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in"
          >
            <WarningCircle size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* OTP Success Notice */}
        {otpNotice && (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in"
          >
            <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{otpNotice}</div>
          </div>
        )}

        {/* Admin Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-bold text-slate-700 block">
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <EnvelopeSimple size={18} />
              </div>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@knowurcoach.in"
                required
                className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all font-medium"
              />
            </div>
          </div>

          {authMethod === "password" && (
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-bold text-slate-700 block">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LockKey size={18} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-11 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer min-w-[44px] justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {authMethod === "otp" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-otp" className="text-xs font-bold text-slate-700">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="text-[11px] font-bold text-[#0066ff] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSendingOtp ? "Sending code..." : isOtpSent ? "Resend Code" : "Send OTP to Email"}
                </button>
              </div>

              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || !email}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3 px-4 rounded-2xl border border-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <PaperPlaneTilt size={16} weight="bold" />
                  <span>{isSendingOtp ? "Dispatching Admin OTP..." : "Send Verification Code to Admin Email"}</span>
                </button>
              ) : (
                <div className="relative">
                  <input
                    id="admin-otp"
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    required
                    className="w-full bg-white border border-slate-200/90 rounded-2xl py-3 px-4 text-center tracking-[0.5em] text-lg font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-slate-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </span>
            ) : (
              <>
                <span>Access Admin Control Plane</span>
                <ArrowRight size={18} weight="bold" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          KnowUrCoach Central Platform Operations • India
        </div>
      </div>

      {/* Bottom Legal / Status Bar */}
      <footer className="text-center text-xs text-slate-400 mt-6 relative z-10">
        Restricted area. All access attempts are cryptographically signed & logged.
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Loading security console...</p>
          </div>
        </div>
      }
    >
      <AdminLoginFormContent />
    </Suspense>
  );
}
