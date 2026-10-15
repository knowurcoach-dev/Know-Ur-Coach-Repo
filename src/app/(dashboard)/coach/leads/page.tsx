"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import { useAuth } from '@/hooks/useAuth';
import { getCoachLeadsData, updateCoachLeadStatus, createCoachLead } from '@/lib/actions';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  WhatsappLogo,
  Phone,
  CheckCircle,
  ArrowLeft,
  User,
  Clock,
  Sparkle,
  Plus,
  X,
  Spinner,
  Users,
} from '@phosphor-icons/react';

interface LeadItem {
  id: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  inquiryNotes: string;
  status: string; // new | trial | enrolled | lost
  createdAt?: string | Date;
}

export default function CoachLeadsPage() {
  const { showToast } = usePersona();
  const { session, user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [centreData, setCentreData] = useState<any>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'trial' | 'enrolled'>('all');

  // Manual lead creation modal state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const userEmail = session?.user?.email || (user as any)?.email;

  const loadData = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getCoachLeadsData(userEmail);
      if (res.success) {
        setCentreData(res.centre);
        setLeads(res.leads || []);
      }
    } catch (err) {
      console.warn("Could not load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const handleUpdateStatus = (id: string, newStatus: string, name: string) => {
    startTransition(async () => {
      try {
        const res = await updateCoachLeadStatus(id, newStatus);
        if (res.success) {
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
          );
          showToast(`Updated ${name}'s status to ${newStatus.toUpperCase()}`);
        }
      } catch {
        showToast('Failed to update lead status');
      }
    });
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreData?.id) {
      showToast('⚠️ Please setup your coaching centre profile first.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createCoachLead({
          centreId: centreData.id,
          parentName: newParentName.trim(),
          parentPhone: newParentPhone.trim(),
          childName: newChildName.trim(),
          childAge: parseInt(newChildAge, 10) || 7,
          inquiryNotes: newNotes.trim() || 'Direct parent walk-in / phone inquiry',
          status: 'new',
        });

        if (res.success && res.lead) {
          setLeads((prev) => [res.lead, ...prev]);
          setIsAddLeadModalOpen(false);
          setNewParentName('');
          setNewParentPhone('');
          setNewChildName('');
          setNewChildAge('');
          setNewNotes('');
          showToast(`✅ Successfully registered lead for ${res.lead.parentName}!`);
        } else {
          showToast(res.message || 'Could not save lead');
        }
      } catch {
        showToast('Error saving lead');
      }
    });
  };

  const academyName = centreData?.name || (session?.user?.name ? `${session.user.name}'s Academy` : 'Your Academy');
  const newCount = leads.filter((l) => l.status === 'new').length;

  if (loading) {
    return <GeneralCoachPageSkeleton title="Parent Inquiries & Leads CRM" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with Back button */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/dashboard"
              className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Parent Inquiries &amp; Leads CRM
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {leads.length} Total Inquiries • {academyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {newCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-3.5 py-1.5 rounded-full">
                {newCount} New Inquiries
              </span>
            )}
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} weight="bold" />
              <span>Log Parent Lead</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filter === 'new'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            New Inquiries ({leads.filter((l) => l.status === 'new').length})
          </button>
          <button
            onClick={() => setFilter('trial')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filter === 'trial'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trial Booked ({leads.filter((l) => l.status === 'trial').length})
          </button>
          <button
            onClick={() => setFilter('enrolled')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filter === 'enrolled'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Enrolled Students ({leads.filter((l) => l.status === 'enrolled').length})
          </button>
        </div>

        {/* Leads Cards Grid or Clean Empty State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Spinner size={32} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading student inquiries...</p>
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.map((lead) => {
              const statusColor =
                lead.status === 'enrolled'
                  ? 'bg-emerald-100 text-emerald-800'
                  : lead.status === 'trial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800';

              const cleanPhone = lead.parentPhone.replace(/\D/g, '');

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{lead.parentName}</h3>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Student: <strong className="text-slate-800">{lead.childName}</strong> (Age {lead.childAge})
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                      "{lead.inquiryNotes}"
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                          lead.parentName
                        )},%20this%20is%20${encodeURIComponent(
                          academyName
                        )}%20regarding%20your%20sports%20trial%20inquiry.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
                      >
                        <WhatsappLogo size={15} weight="fill" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
                      >
                        <Phone size={14} weight="bold" />
                        <span>Call</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lead.status !== 'trial' && lead.status !== 'enrolled' && (
                        <button
                          onClick={() => handleUpdateStatus(lead.id, 'trial', lead.parentName)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          Book Trial
                        </button>
                      )}
                      {lead.status !== 'enrolled' && (
                        <button
                          onClick={() => handleUpdateStatus(lead.id, 'enrolled', lead.parentName)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={13} weight="bold" />
                          <span>Mark Enrolled</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Users size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {filter === 'all' ? 'No Student Inquiries Yet' : `No leads found with status: ${filter}`}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When parents discover {academyName} on KnowUrCoach, their free trial bookings and admission inquiries will appear here automatically with one-tap WhatsApp reply.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsAddLeadModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <Plus size={16} weight="bold" />
                <span>Log Walk-in Lead</span>
              </button>
              <Link
                href="/coach/promote"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                <Sparkle size={15} weight="fill" />
                <span>Promote Academy Listing</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Manual Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <User size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Register Student Lead</h3>
              </div>
              <button
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Parent Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Saxena"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Parent Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9837123456"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Child Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Child Age *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    placeholder="e.g. 8"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Inquiry Notes / Preferred Batch
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Looking for beginner evening slot. Inquired at reception."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
