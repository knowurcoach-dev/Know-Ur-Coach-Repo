"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import { getPaymentTransactionsAction } from '@/lib/actions';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Receipt,
  CreditCard,
  CheckCircle,
  WarningCircle,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel,
  Buildings,
  Copy,
  Check,
  ArrowSquareOut,
  ShieldCheck,
  CurrencyInr,
  X,
  CaretRight,
  Sparkle,
  Phone,
  EnvelopeSimple,
  Calendar,
  Eye,
} from '@phosphor-icons/react';

interface Transaction {
  id: string;
  orderId: string | null;
  paymentId: string | null;
  centreId: string | null;
  centreName: string;
  locality?: string;
  contactPhone?: string;
  contactEmail?: string;
  planTier: string | null;
  billingCycle: string | null;
  amount: number;
  currency: string;
  status: string; // INITIATED, PENDING, SUCCESS, FAILED
  isTestMode: boolean;
  paymentMethod?: string | null;
  notes?: any;
  rawResponse?: any;
  createdAt: string;
}

export default function AdminOrdersDashboardPage() {
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'INITIATED' | 'PENDING' | 'FAILED'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'TEST' | 'LIVE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await getPaymentTransactionsAction(200);
      if (res.success && res.transactions) {
        setTransactions(res.transactions as Transaction[]);
      } else {
        showToast('⚠️ Could not load transaction records.');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      showToast('❌ Error connecting to database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered list
  const filtered = transactions.filter((t) => {
    // Status filter
    const statusUpper = (t.status || 'PENDING').toUpperCase();
    if (statusFilter !== 'ALL' && statusUpper !== statusFilter) {
      return false;
    }

    // Mode filter
    if (modeFilter === 'TEST' && !t.isTestMode) return false;
    if (modeFilter === 'LIVE' && t.isTestMode) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (t.orderId && t.orderId.toLowerCase().includes(q)) ||
      (t.paymentId && t.paymentId.toLowerCase().includes(q)) ||
      (t.centreName && t.centreName.toLowerCase().includes(q)) ||
      (t.locality && t.locality.toLowerCase().includes(q)) ||
      (t.contactPhone && t.contactPhone.toLowerCase().includes(q)) ||
      (t.contactEmail && t.contactEmail.toLowerCase().includes(q)) ||
      (t.planTier && t.planTier.toLowerCase().includes(q))
    );
  });

  // Calculate Metrics
  const totalSuccess = transactions.filter((t) => (t.status || '').toUpperCase() === 'SUCCESS');
  const totalRevenue = totalSuccess.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalFailed = transactions.filter((t) => (t.status || '').toUpperCase() === 'FAILED');
  const totalPending = transactions.filter((t) => {
    const s = (t.status || '').toUpperCase();
    return s === 'PENDING' || s === 'INITIATED';
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} weight="fill" className="text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'INITIATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} weight="bold" className="text-blue-600" />
            INITIATED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            PENDING
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <WarningCircle size={13} weight="fill" className="text-rose-600" />
            FAILED
          </span>
        );
    }
  };

  if (isLoading && transactions.length === 0) {
    return <AdminTableSkeleton title="Payments & Orders Dashboard" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Executive Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-1">
              <Receipt size={16} weight="fill" className="text-emerald-400" />
              Razorpay Transactions Audit
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Payments &amp; Orders Dashboard
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Real-time tracking of Razorpay subscription orders, gateway attempts, and payment status audits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                startTransition(() => {
                  loadTransactions();
                });
              }}
              disabled={isLoading || isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise
                size={15}
                weight="bold"
                className={isLoading || isPending ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/payments"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20"
            >
              <CreditCard size={15} weight="bold" />
              <span>Gateway Config</span>
            </Link>
          </div>
        </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Settled Revenue
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CurrencyInr size={18} weight="bold" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle size={12} weight="fill" />
            {totalSuccess.length} successful order{totalSuccess.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Successful Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Successful
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={18} weight="fill" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {totalSuccess.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Active plan activations
          </div>
        </div>

        {/* Initiated / Pending */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Initiated / Pending
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} weight="bold" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {totalPending.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Checkout in progress
          </div>
        </div>

        {/* Failed / Cancelled */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Failed / Cancelled
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <WarningCircle size={18} weight="fill" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {totalFailed.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Declined or dismissed
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Payment ID, Coach/Academy, locality, phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 text-xs font-black">
            <button
              onClick={() => setModeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                modeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Modes
            </button>
            <button
              onClick={() => setModeFilter('TEST')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                modeFilter === 'TEST' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Test
            </button>
            <button
              onClick={() => setModeFilter('LIVE')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                modeFilter === 'LIVE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Live
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Funnel size={12} /> Status:
          </span>
          {(['ALL', 'SUCCESS', 'INITIATED', 'PENDING', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st} {st !== 'ALL' && `(${transactions.filter((t) => (t.status || '').toUpperCase() === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Transaction Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <AdminTableSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900">No payment orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL'
                ? 'No transaction records match your search or filter filters. Try resetting filters.'
                : 'No payments have been recorded yet. Orders created via Razorpay will be tracked here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order Ref / Date</th>
                  <th className="py-3.5 px-4">Linked Coach / Academy</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Gateway IDs</th>
                  <th className="py-3.5 px-4">Plan / Cycle</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((tx) => {
                  const dateStr = new Date(tx.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Order Ref & Date */}
                      <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <span>{tx.id.slice(0, 10)}...</span>
                          {tx.isTestMode ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                              Test
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-sans">
                          <Calendar size={11} />
                          {dateStr} • {timeStr}
                        </div>
                      </td>

                      {/* Linked Coach / Academy */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5 truncate max-w-[200px]">
                          <Buildings size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{tx.centreName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          {tx.locality && <span>📍 {tx.locality}</span>}
                          {tx.contactPhone && <span>📞 {tx.contactPhone}</span>}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">
                          {tx.currency || 'INR'}
                        </div>
                      </td>

                      {/* Gateway IDs */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px]">
                        {tx.orderId ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <span className="text-slate-400 font-sans text-[10px]">Order:</span>
                            <span>{tx.orderId}</span>
                            <button
                              onClick={() => handleCopy(tx.orderId!, `Order ${tx.orderId}`)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                              title="Copy Order ID"
                            >
                              {copiedId === `Order ${tx.orderId}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Order ID</span>
                        )}

                        {tx.paymentId ? (
                          <div className="flex items-center gap-1 text-slate-700 mt-0.5">
                            <span className="text-slate-400 font-sans text-[10px]">Pay:</span>
                            <span>{tx.paymentId}</span>
                            <button
                              onClick={() => handleCopy(tx.paymentId!, `Payment ${tx.paymentId}`)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                              title="Copy Payment ID"
                            >
                              {copiedId === `Payment ${tx.paymentId}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">
                            Pending capture
                          </div>
                        )}
                      </td>

                      {/* Plan / Cycle */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {tx.planTier ? (
                            <span className="uppercase text-[11px] font-black tracking-wide text-purple-700">
                              {tx.planTier}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {tx.billingCycle || 'monthly'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} weight="bold" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* 5. Transaction Details & Audit Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Receipt size={22} weight="bold" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Transaction Audit Details
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedTx.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Status Header Block */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Gateway Status
                  </span>
                  <div className="mt-1">
                    {getStatusBadge(selectedTx.status)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Transaction Amount
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    ₹{Number(selectedTx.amount || 0).toLocaleString('en-IN')} {selectedTx.currency}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">
                    Linked Academy
                  </span>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedTx.centreName}
                  </div>
                  {selectedTx.locality && (
                    <div className="text-slate-500 mt-0.5">Locality: {selectedTx.locality}</div>
                  )}
                  {selectedTx.contactPhone && (
                    <div className="text-slate-500">Phone: {selectedTx.contactPhone}</div>
                  )}
                  {selectedTx.contactEmail && (
                    <div className="text-slate-500">Email: {selectedTx.contactEmail}</div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">
                    Plan & Subscription
                  </span>
                  <div className="font-black text-purple-700 text-sm uppercase">
                    {selectedTx.planTier || 'Not Set'}
                  </div>
                  <div className="text-slate-500 mt-0.5 capitalize">
                    Billing Cycle: {selectedTx.billingCycle || 'monthly'}
                  </div>
                  <div className="text-slate-500">
                    Mode: {selectedTx.isTestMode ? 'Sandbox (Test)' : 'Production (Live)'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 font-mono">
                  <span className="text-slate-400 font-sans font-bold block mb-1">
                    Razorpay Order ID
                  </span>
                  <div className="font-bold text-slate-900 break-all">
                    {selectedTx.orderId || '—'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 font-mono">
                  <span className="text-slate-400 font-sans font-bold block mb-1">
                    Razorpay Payment ID
                  </span>
                  <div className="font-bold text-slate-900 break-all">
                    {selectedTx.paymentId || '— (Not captured)'}
                  </div>
                </div>
              </div>

              {/* Failure / Notes Diagnostic */}
              {selectedTx.notes && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Diagnostic Notes & Failure Log
                  </span>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-40">
                    {JSON.stringify(selectedTx.notes, null, 2)}
                  </pre>
                </div>
              )}

              {/* Raw Gateway Response Payload */}
              {selectedTx.rawResponse && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Gateway Raw Payload
                  </span>
                  <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-40">
                    {JSON.stringify(selectedTx.rawResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(selectedTx.createdAt).toLocaleString('en-IN')}
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
