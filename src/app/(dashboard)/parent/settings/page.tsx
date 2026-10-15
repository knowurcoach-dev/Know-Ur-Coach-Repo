"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePersona } from '@/context/PersonaContext';
import { getParentDashboardData, updateParentProfile } from '@/lib/actions';
import {
  Gear,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Spinner,
  Buildings,
} from '@phosphor-icons/react';
import { TOP_INDIAN_CITIES } from '@/lib/location';

const AGRA_LOCALITIES = [
  'Kamla Nagar',
  'Sanjay Place',
  'Sadar Bazar',
  'Dayalbagh',
  'Tajganj',
  'Civil Lines',
  'Sikandra',
  'Shahganj',
  'Fatehabad Road',
  'Bodla',
];

export default function ParentSettingsPage() {
  const { user, session } = useAuth();
  const { showToast } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Agra');
  const [locality, setLocality] = useState('Kamla Nagar');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const userEmail = session?.user?.email || (user as any)?.email;

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getParentDashboardData(userEmail);
        if (res.success && res.parent) {
          setFullName(res.parent.fullName || user?.name || '');
          setPhone(res.user?.phone || (user as any)?.phone || '');
          setCity(res.parent.city || (user as any)?.city || 'Agra');
          setLocality(res.parent.locality || 'Kamla Nagar');
          setEmergencyName(res.parent.emergencyContactName || '');
          setEmergencyPhone(res.parent.emergencyContactPhone || '');
        }
      } catch (err) {
        console.warn("Could not load parent settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail, user?.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updateParentProfile(userEmail, {
          fullName,
          phone,
          city,
          locality,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        });

        if (res.success) {
          showToast('✅ Account profile updated successfully!');
        } else {
          showToast(res.message || 'Could not update profile');
        }
      } catch {
        showToast('Error saving profile changes');
      }
    });
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Gear size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Parent Account Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Update your residential city, neighborhood locality &amp; emergency info
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Spinner size={32} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading account preferences...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Basic Parent Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Suman Saxena"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={userEmail || ''}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9837123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City *
                    </label>
                    <div className="relative">
                      <Buildings size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {TOP_INDIAN_CITIES.map((c) => (
                          <option key={c.city} value={c.city}>
                            {c.city} ({c.state})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Locality / Area *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      {city.toLowerCase() === 'agra' ? (
                        <select
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {AGRA_LOCALITIES.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}, Agra
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                          placeholder={`e.g. Sector 14, ${city}`}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} weight="fill" className="text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Emergency Contact Details (Sports Ground Safety)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Ramesh Saxena (Uncle / Doctor)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Emergency Phone Number
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="e.g. 9897011223"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Saving Changes...' : 'Save Account Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
