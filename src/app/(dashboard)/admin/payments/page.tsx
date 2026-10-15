"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import {
  getPaymentSettingsAction,
  updatePaymentSettingsAction,
  getPaymentTransactionsAction,
} from '@/lib/actions';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  FloppyDisk,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  Lock,
  Key,
  Globe,
  Lightning,
  Copy,
  Check,
  ArrowSquareOut,
  Sparkle,
  Receipt,
  Tag,
  Funnel,
  Buildings,
  Info,
} from '@phosphor-icons/react';

interface MaskedSettings {
  id: string;
  isTestMode: boolean;
  razorpayTestKeyId: string;
  hasTestSecret: boolean;
  maskedTestSecret: string;
  razorpayLiveKeyId: string;
  hasLiveSecret: boolean;
  maskedLiveSecret: string;
  webhookSecret: string;
  hasWebhookSecret: boolean;
  updatedAt: string | Date;
}

interface TransactionItem {
  id: string;
  orderId: string | null;
  paymentId: string | null;
  centreName: string;
  planTier: string | null;
  billingCycle: string | null;
  amount: number;
  currency: string;
  status: string;
  isTestMode: boolean;
  createdAt: string;
}

export default function AdminPaymentSettingsPage() {
  const { showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Active tab: 'settings' | 'transactions'
  const [activeTab, setActiveTab] = useState<'settings' | 'transactions'>('settings');

  // Form State
  const [isTestMode, setIsTestMode] = useState(true);
  const [razorpayTestKeyId, setRazorpayTestKeyId] = useState('');
  const [razorpayTestKeySecret, setRazorpayTestKeySecret] = useState('');
  const [razorpayLiveKeyId, setRazorpayLiveKeyId] = useState('');
  const [razorpayLiveKeySecret, setRazorpayLiveKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Metadata from DB
  const [savedSettings, setSavedSettings] = useState<MaskedSettings | null>(null);

  // Password visibility toggles
  const [showTestSecretInput, setShowTestSecretInput] = useState(false);
  const [showLiveSecretInput, setShowLiveSecretInput] = useState(false);
  const [showWebhookSecretInput, setShowWebhookSecretInput] = useState(false);

  // Copied feedback helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Transactions list
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [searchTx, setSearchTx] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, txRes] = await Promise.all([
        getPaymentSettingsAction(),
        getPaymentTransactionsAction(50),
      ]);

      if (settingsRes.success && settingsRes.settings) {
        const s = settingsRes.settings;
        setSavedSettings(s);
        setIsTestMode(s.isTestMode);
        setRazorpayTestKeyId(s.razorpayTestKeyId || '');
        setRazorpayLiveKeyId(s.razorpayLiveKeyId || '');
        // Secrets remain blank or masked placeholder unless user modifies
        setRazorpayTestKeySecret(s.hasTestSecret ? s.maskedTestSecret : '');
        setRazorpayLiveKeySecret(s.hasLiveSecret ? s.maskedLiveSecret : '');
        setWebhookSecret(s.hasWebhookSecret ? s.webhookSecret : '');
      }

      if (txRes.success && txRes.transactions) {
        setTransactions(txRes.transactions);
      }
    } catch (err) {
      console.error('Error loading payment settings:', err);
      showToast('❌ Error loading payment gateway configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload: any = {
          isTestMode,
          razorpayTestKeyId,
          razorpayLiveKeyId,
        };

        // Only send secrets if modified (not empty and doesn't contain mask bullets)
        if (razorpayTestKeySecret && !razorpayTestKeySecret.includes('•')) {
          payload.razorpayTestKeySecret = razorpayTestKeySecret;
        }

        if (razorpayLiveKeySecret && !razorpayLiveKeySecret.includes('•')) {
          payload.razorpayLiveKeySecret = razorpayLiveKeySecret;
        }

        if (webhookSecret && !webhookSecret.includes('•')) {
          payload.webhookSecret = webhookSecret;
        }

        const res = await updatePaymentSettingsAction(payload);
        if (res.success && res.settings) {
          showToast('✅ Razorpay payment gateway credentials securely saved!');
          setSavedSettings(res.settings);
          setRazorpayTestKeySecret(
            res.settings.hasTestSecret ? res.settings.maskedTestSecret : ''
          );
          setRazorpayLiveKeySecret(
            res.settings.hasLiveSecret ? res.settings.maskedLiveSecret : ''
          );
          setWebhookSecret(
            res.settings.hasWebhookSecret ? res.settings.webhookSecret : ''
          );
        } else {
          showToast(`⚠️ ${res.message || 'Failed to save settings'}`);
        }
      } catch (err: any) {
        console.error('Save settings error:', err);
        showToast('❌ Failed to save payment gateway settings');
      }
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchTx) {
      const q = searchTx.toLowerCase();
      const matchName = t.centreName?.toLowerCase().includes(q);
      const matchOrder = t.orderId?.toLowerCase().includes(q);
      const matchPay = t.paymentId?.toLowerCase().includes(q);
      const matchTier = t.planTier?.toLowerCase().includes(q);
      return matchName || matchOrder || matchPay || matchTier;
    }
    return true;
  });

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/razorpay`
      : 'https://knowurcoach.in/api/webhooks/razorpay';

  if (isLoading) {
    return <AdminTableSkeleton title="Payment Gateway Configuration" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-extrabold uppercase mb-2">
              <CreditCard size={16} weight="fill" className="text-emerald-400" />
              Razorpay Payment Gateway Core
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Payment Gateway Settings</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                  isTestMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isTestMode ? 'Test Sandbox Active' : 'Live Mode Active'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              Configure Razorpay credentials for coaches and academy subscription plan checkouts. Toggle between Test sandbox and Live production seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isLoading || isPending}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>{isPending ? 'Saving...' : 'Save Credentials'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Key size={16} weight="bold" />
            <span>API Credentials & Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt size={16} weight="bold" />
            <span>Transaction Telemetry ({transactions.length})</span>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="text-xs font-black text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-all"
            >
              <Receipt size={14} weight="bold" />
              <span>Orders Dashboard</span>
              <ArrowSquareOut size={13} weight="bold" />
            </Link>
            <Link
              href="/admin/plans"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Plans</span>
              <ArrowSquareOut size={14} weight="bold" />
            </Link>
          </div>
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fade-in">
            {/* Global Test Mode Toggle Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      Gateway Environment Mode
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      Global Switch
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Controls whether all checkout transactions utilize Razorpay Sandbox (Test) or Production (Live) keys.
                  </p>
                </div>

                {/* Main Toggle Switch */}
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start sm:self-auto">
                  <span
                    className={`text-xs font-black cursor-pointer px-3 py-1.5 rounded-xl transition-all ${
                      isTestMode
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    onClick={() => setIsTestMode(true)}
                  >
                    Test Sandbox
                  </span>
                  <span
                    className={`text-xs font-black cursor-pointer px-3 py-1.5 rounded-xl transition-all ${
                      !isTestMode
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    onClick={() => setIsTestMode(false)}
                  >
                    Live Production
                  </span>
                </div>
              </div>

              {/* Status Alert Banner */}
              {isTestMode ? (
                <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Lightning size={18} weight="fill" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black text-amber-950 block">
                      Test Mode is Active globally
                    </span>
                    <span className="text-amber-800">
                      Coaches and academies will checkout using Razorpay Test credentials. Cards and UPI will simulate transactions without real money. Perfect for development, verification, and demo trials.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3.5 text-emerald-950 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle size={18} weight="fill" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black text-emerald-950 block">
                      Live Production Mode is Active
                    </span>
                    <span className="text-emerald-900">
                      Real INR transactions will be processed via Razorpay Live credentials. Ensure your live bank account settlement and business compliance are verified in Razorpay Dashboard.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Test Credentials & Live Credentials Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Test Mode Credentials */}
              <div
                className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-xs space-y-6 transition-all ${
                  isTestMode
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200/90 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <Key size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">
                        Test Mode Credentials
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Sandbox keys starting with <code className="font-mono bg-slate-100 px-1 rounded">rzp_test_</code>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      isTestMode
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isTestMode ? 'Currently Active' : 'Standby'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Test Key ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <span>Razorpay Test Key ID</span>
                      {razorpayTestKeyId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(razorpayTestKeyId, 'Test Key ID')}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'Test Key ID' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                          <span>{copiedKey === 'Test Key ID' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={razorpayTestKeyId}
                        onChange={(e) => setRazorpayTestKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Publicly accessible test client key provided in Razorpay Dashboard Settings &rarr; API Keys.
                    </p>
                  </div>

                  {/* Test Key Secret */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} weight="bold" className="text-amber-600" />
                        <span>Razorpay Test Key Secret</span>
                      </div>
                      {savedSettings?.hasTestSecret && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle size={10} weight="fill" />
                          <span>Secret Saved</span>
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showTestSecretInput ? 'text' : 'password'}
                        value={razorpayTestKeySecret}
                        onChange={(e) => setRazorpayTestKeySecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTestSecretInput(!showTestSecretInput)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showTestSecretInput ? 'Hide' : 'Show'}
                      >
                        {showTestSecretInput ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Never exposed to the client browser. Leave untouched to retain current secret, or type new secret to overwrite.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Live Mode Credentials */}
              <div
                className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-xs space-y-6 transition-all ${
                  !isTestMode
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                      <ShieldCheck size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">
                        Live Mode Credentials
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Production keys starting with <code className="font-mono bg-slate-100 px-1 rounded">rzp_live_</code>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      !isTestMode
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {!isTestMode ? 'Currently Active' : 'Standby'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Live Key ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <span>Razorpay Live Key ID</span>
                      {razorpayLiveKeyId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(razorpayLiveKeyId, 'Live Key ID')}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'Live Key ID' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                          <span>{copiedKey === 'Live Key ID' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={razorpayLiveKeyId}
                        onChange={(e) => setRazorpayLiveKeyId(e.target.value)}
                        placeholder="rzp_live_..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Production Merchant Key generated from your live activated Razorpay account.
                    </p>
                  </div>

                  {/* Live Key Secret */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} weight="bold" className="text-emerald-600" />
                        <span>Razorpay Live Key Secret</span>
                      </div>
                      {savedSettings?.hasLiveSecret && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle size={10} weight="fill" />
                          <span>Secret Saved</span>
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showLiveSecretInput ? 'text' : 'password'}
                        value={razorpayLiveKeySecret}
                        onChange={(e) => setRazorpayLiveKeySecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLiveSecretInput(!showLiveSecretInput)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showLiveSecretInput ? 'Hide' : 'Show'}
                      >
                        {showLiveSecretInput ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      High-security merchant secret used for generating live orders and server verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook Configuration Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                    <Globe size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Razorpay Webhook Integration
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Allows Razorpay to notify your platform automatically when an async payment is captured or confirmed.
                    </p>
                  </div>
                </div>

                <a
                  href="https://dashboard.razorpay.com/app/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                >
                  <span>Open Razorpay Webhooks</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Webhook Endpoint URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>Webhook Destination URL</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'Webhook URL' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                      <span>{copiedKey === 'Webhook URL' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-slate-700 cursor-text select-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Paste this into Razorpay Dashboard &rarr; Settings &rarr; Webhooks.
                  </p>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>Webhook Secret (Optional verification token)</span>
                    {savedSettings?.hasWebhookSecret && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle size={10} weight="fill" />
                        <span>Configured</span>
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showWebhookSecretInput ? 'text' : 'password'}
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 pr-10 text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecretInput(!showWebhookSecretInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showWebhookSecretInput ? 'Hide' : 'Show'}
                    >
                      {showWebhookSecretInput ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Secret token specified when creating the webhook in Razorpay to verify HMAC signatures.
                  </p>
                </div>
              </div>

              {/* Supported Events Guide */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Info size={16} className="text-indigo-600 shrink-0" />
                  <span>Required events to select in Razorpay:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 px-2 py-1 rounded-lg">
                    payment.captured
                  </span>
                  <span className="bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 px-2 py-1 rounded-lg">
                    order.paid
                  </span>
                  <span className="bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 px-2 py-1 rounded-lg">
                    payment.failed
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={loadData}
                disabled={isPending}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black px-5 py-3 rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                Reset Unsaved Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <FloppyDisk size={18} weight="bold" />
                <span>{isPending ? 'Saving Gateway Settings...' : 'Save Razorpay Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Razorpay Subscription Telemetry
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Audit log of checkout order initiations, captured payments, and subscription plan activations.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Search order, payment, academy..."
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Academy / Centre</th>
                    <th className="pb-3 px-3">Plan Tier</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Mode</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Order / Payment ID</th>
                    <th className="pb-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No transactions recorded yet in this environment.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-extrabold text-slate-900 block">
                            {tx.centreName}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full border ${
                              tx.planTier === 'PREMIUM'
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : tx.planTier === 'STANDARD'
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {tx.planTier || 'PLAN'} ({tx.billingCycle || 'mo'})
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-black text-slate-900">
                          ₹{tx.amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              tx.isTestMode
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {tx.isTestMode ? 'Test' : 'Live'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${
                              tx.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                          {tx.paymentId ? (
                            <span className="text-emerald-700 font-bold block">{tx.paymentId}</span>
                          ) : null}
                          {tx.orderId ? (
                            <span className="text-slate-400 text-[10px] block">{tx.orderId}</span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
