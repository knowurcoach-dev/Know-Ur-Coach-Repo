"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { usePersona } from '@/context/PersonaContext';
import {
  getLocationConfigAction,
  updateLocationConfigAction,
  resetLocationConfigAction,
} from '@/lib/actions';
import {
  LocationConfig,
  ConfiguredCityItem,
  DEFAULT_LOCATION_CONFIG,
  DEFAULT_CONFIGURED_CITIES,
  LocationSortMode,
  ModalFrequency,
  sortConfiguredCities,
} from '@/lib/location-config';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { AdminTableSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  MapPin,
  Compass,
  FloppyDisk,
  ArrowsClockwise,
  ArrowUp,
  ArrowDown,
  Trash,
  PencilSimple,
  Plus,
  Check,
  CheckCircle,
  Eye,
  Sliders,
  Buildings,
  NavigationArrow,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Sparkle,
  DeviceMobile,
  Desktop,
  Info,
  Clock,
  ShieldCheck,
  X,
  ToggleLeft,
  ToggleRight,
} from '@phosphor-icons/react';

type SettingsTab = 'triggers' | 'default_location' | 'copy_actions' | 'city_arrangements';

export default function AdminLocationManagementPage() {
  const { showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SettingsTab>('triggers');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Config State
  const [config, setConfig] = useState<LocationConfig>(DEFAULT_LOCATION_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<LocationConfig>(DEFAULT_LOCATION_CONFIG);
  const [academyCounts, setAcademyCounts] = useState<Record<string, number>>({});

  // Interactive Preview State
  const [previewSelectedCity, setPreviewSelectedCity] = useState<string>('');
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Modals
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [cityModalState, setCityModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    cityId?: string;
    city: string;
    state: string;
    lat: number;
    lon: number;
    icon: string;
    tag: string;
    isActive: boolean;
  }>({
    isOpen: false,
    mode: 'add',
    city: '',
    state: '',
    lat: 27.1767,
    lon: 78.0081,
    icon: '📍',
    tag: '',
    isActive: true,
  });

  const [deleteCityState, setDeleteCityState] = useState<{
    isOpen: boolean;
    cityItem: ConfiguredCityItem | null;
  }>({
    isOpen: false,
    cityItem: null,
  });

  // Load configuration from server
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getLocationConfigAction();
      if (res.success && res.config) {
        setConfig(res.config);
        setOriginalConfig(res.config);
        setPreviewSelectedCity(res.config.defaultCity);
        if (res.academyCounts) {
          setAcademyCounts(res.academyCounts);
        }
      } else {
        showToast("⚠️ Could not load location settings. Using defaults.");
      }
    } catch (err) {
      console.error("Failed to load location config:", err);
      showToast("Error loading location configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Detect dirty state
  const isDirty = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig]);

  // Sorted cities for display and preview
  const sortedCities = useMemo(() => {
    return sortConfiguredCities(config.cities, config.sortMode, academyCounts);
  }, [config.cities, config.sortMode, academyCounts]);

  const activeCitiesCount = useMemo(() => {
    return config.cities.filter((c) => c.isActive).length;
  }, [config.cities]);

  // Save handler
  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await updateLocationConfigAction(config);
        if (res.success) {
          showToast("✅ Location & modal configuration saved successfully!");
          if (res.config) {
            setConfig(res.config);
            setOriginalConfig(res.config);
          }
          if (res.academyCounts) {
            setAcademyCounts(res.academyCounts);
          }
        } else {
          showToast(`Failed to save: ${res.message}`);
        }
      } catch (err: any) {
        showToast(`Save error: ${err?.message || 'Unknown error'}`);
      }
    });
  };

  // Restore defaults handler
  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    startTransition(async () => {
      try {
        const res = await resetLocationConfigAction();
        if (res.success) {
          showToast("🔄 Restored to standard KnowUrCoach location defaults!");
          if (res.config) {
            setConfig(res.config);
            setOriginalConfig(res.config);
            setPreviewSelectedCity(res.config.defaultCity);
          }
          if (res.academyCounts) {
            setAcademyCounts(res.academyCounts);
          }
        } else {
          showToast(`Reset failed: ${res.message}`);
        }
      } catch (err: any) {
        showToast("Failed to restore defaults");
      }
    });
  };

  // Reorder cities (move up / down)
  const handleMoveCity = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.cities.length) return;

    const newCities = [...config.cities];
    const temp = newCities[index];
    newCities[index] = newCities[targetIndex];
    newCities[targetIndex] = temp;

    // Re-index order numbers
    const updated = newCities.map((c, i) => ({ ...c, order: i + 1 }));
    setConfig((prev) => ({
      ...prev,
      sortMode: 'manual', // Switch to manual sort mode when reordering
      cities: updated,
    }));
  };

  // Toggle active/inactive
  const handleToggleCityActive = (cityId: string) => {
    setConfig((prev) => ({
      ...prev,
      cities: prev.cities.map((c) =>
        c.id === cityId ? { ...c, isActive: !c.isActive } : c
      ),
    }));
  };

  // Add / Edit City Submit
  const handleSaveCityModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityModalState.city.trim()) {
      showToast("Please provide a city name.");
      return;
    }

    if (cityModalState.mode === 'add') {
      const newCityItem: ConfiguredCityItem = {
        id: `city-${Date.now()}-${cityModalState.city.toLowerCase().replace(/\s+/g, '-')}`,
        city: cityModalState.city.trim(),
        state: cityModalState.state.trim() || 'India',
        lat: Number(cityModalState.lat) || 27.1767,
        lon: Number(cityModalState.lon) || 78.0081,
        icon: cityModalState.icon.trim() || '📍',
        tag: cityModalState.tag.trim() || '',
        isActive: cityModalState.isActive,
        order: config.cities.length + 1,
      };
      setConfig((prev) => ({
        ...prev,
        cities: [...prev.cities, newCityItem],
      }));
      showToast(`Added ${newCityItem.city} to city arrangements!`);
    } else {
      setConfig((prev) => ({
        ...prev,
        cities: prev.cities.map((c) =>
          c.id === cityModalState.cityId
            ? {
                ...c,
                city: cityModalState.city.trim(),
                state: cityModalState.state.trim(),
                lat: Number(cityModalState.lat),
                lon: Number(cityModalState.lon),
                icon: cityModalState.icon.trim() || '📍',
                tag: cityModalState.tag.trim() || '',
                isActive: cityModalState.isActive,
              }
            : c
        ),
      }));
      showToast(`Updated ${cityModalState.city}!`);
    }

    setCityModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Delete City Submit
  const handleConfirmDeleteCity = () => {
    if (!deleteCityState.cityItem) return;
    const cityToDelete = deleteCityState.cityItem;
    setConfig((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c.id !== cityToDelete.id),
      // If default city was deleted, fallback to first available
      defaultCity:
        prev.defaultCity === cityToDelete.city
          ? prev.cities.find((c) => c.id !== cityToDelete.id)?.city || 'All India'
          : prev.defaultCity,
    }));
    showToast(`Removed ${cityToDelete.city} from list.`);
    setDeleteCityState({ isOpen: false, cityItem: null });
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Location & Entry Modal Management" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24 md:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0a1128] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-extrabold uppercase mb-2">
              <MapPin size={16} weight="fill" className="text-emerald-400" />
              Regional &amp; Hyperlocal Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Location &amp; Entry Modal Management
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Configure visitor entry modal behavior, landing fallback city, city ordering, badges, and preview real-time changes instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={15} />
              <span>Restore Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
                isDirty
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <ArrowsClockwise size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FloppyDisk size={16} weight="bold" />
                  <span>{isDirty ? 'Save Changes *' : 'Saved'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Default Landing Hub</div>
            <div className="text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5 truncate">
              <span>{config.defaultCity}</span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Auto-Popup on Land</div>
            <div className="text-lg font-black mt-1 flex items-center gap-2">
              {config.autoShowModal ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={18} weight="fill" />
                  Enabled ({config.autoShowDelayMs}ms)
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <X size={18} weight="bold" />
                  Disabled
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Cities</div>
            <div className="text-lg font-black text-slate-900 mt-1">
              <span className="text-emerald-700">{activeCitiesCount}</span>
              <span className="text-slate-400 text-sm font-semibold"> / {config.cities.length} Total</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Arrangement Mode</div>
            <div className="text-sm font-black text-indigo-700 mt-1 capitalize flex items-center gap-1">
              <Sliders size={16} weight="bold" />
              <span>{config.sortMode.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Settings Tabs & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('triggers')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === 'triggers'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Clock size={16} weight="bold" />
                <span>Popup &amp; Triggers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('default_location')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === 'default_location'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <MapPin size={16} weight="bold" />
                <span>Default Landing Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('copy_actions')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === 'copy_actions'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <PencilSimple size={16} weight="bold" />
                <span>Modal Copy &amp; Buttons</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('city_arrangements')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === 'city_arrangements'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Buildings size={16} weight="bold" />
                <span>Cities &amp; Ordering ({config.cities.length})</span>
              </button>
            </div>

            {/* TAB 1: POPUP & TRIGGERS */}
            {activeTab === 'triggers' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock size={20} weight="fill" className="text-emerald-600" />
                    Entry Modal Trigger Settings
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control how and when the location selection modal pops up for incoming visitors.
                  </p>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {/* Auto-Show Toggle */}
                  <div className="pt-2 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 max-w-md">
                      <div className="text-xs font-extrabold text-slate-900">
                        Auto-Show Modal on Website Load
                      </div>
                      <div className="text-[11px] text-slate-500">
                        When enabled, visitors who haven&apos;t chosen a city yet will automatically see the location selector popup on initial visit.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, autoShowModal: !prev.autoShowModal }))}
                      className="cursor-pointer text-slate-800 transition-transform active:scale-90"
                    >
                      {config.autoShowModal ? (
                        <ToggleRight size={42} weight="fill" className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={42} weight="fill" className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* Delay Slider */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-slate-900">
                        Popup Delay Before Opening: <span className="text-emerald-700 font-black">{config.autoShowDelayMs} ms</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {config.autoShowDelayMs === 0 ? 'Instant' : `${(config.autoShowDelayMs / 1000).toFixed(1)} seconds`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={4000}
                      step={200}
                      value={config.autoShowDelayMs}
                      onChange={(e) => setConfig((prev) => ({ ...prev, autoShowDelayMs: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>0ms (Instant)</span>
                      <span>600ms (Recommended)</span>
                      <span>1500ms</span>
                      <span>3000ms+</span>
                    </div>
                  </div>

                  {/* Dismissible Toggle */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 max-w-md">
                      <div className="text-xs font-extrabold text-slate-900">
                        Allow Visitor to Dismiss Modal
                      </div>
                      <div className="text-[11px] text-slate-500">
                        If disabled, visitors are required to choose a city before browsing (gated mode). If enabled, clicking outside or close falls back to default city.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, isDismissible: !prev.isDismissible }))}
                      className="cursor-pointer text-slate-800 transition-transform active:scale-90"
                    >
                      {config.isDismissible ? (
                        <ToggleRight size={42} weight="fill" className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={42} weight="fill" className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* Modal Frequency */}
                  <div className="pt-4 space-y-2">
                    <div className="text-xs font-extrabold text-slate-900">
                      Popup Persistence &amp; Frequency
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'once_ever' as ModalFrequency,
                          title: 'Once Per Visitor',
                          desc: 'Remembered permanently in localStorage until manually changed.',
                        },
                        {
                          id: 'session' as ModalFrequency,
                          title: 'Once Per Session',
                          desc: 'Prompt again if visitor returns on another browser session.',
                        },
                        {
                          id: 'always_until_selected' as ModalFrequency,
                          title: 'Always until Picked',
                          desc: 'Show on every page visit until a location is explicitly selected.',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, showFrequency: item.id }))}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            config.showFrequency === item.id
                              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                            <span>{item.title}</span>
                            {config.showFrequency === item.id && (
                              <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DEFAULT LANDING HUB */}
            {activeTab === 'default_location' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin size={20} weight="fill" className="text-emerald-600" />
                    Default Landing Hub
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    The city and coordinates assigned to new users when they land on KnowUrCoach before choosing a custom location.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Quick Select from Active Cities */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      Quick Pick from Active Hubs:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {config.cities
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setConfig((prev) => ({
                                ...prev,
                                defaultCity: c.city,
                                defaultLocality: c.city,
                                defaultLat: c.lat,
                                defaultLon: c.lon,
                              }));
                              setPreviewSelectedCity(c.city);
                              showToast(`Default hub set to ${c.city}`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                              config.defaultCity.toLowerCase() === c.city.toLowerCase()
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{c.icon || '📍'}</span>
                            <span>{c.city}</span>
                            {config.defaultCity.toLowerCase() === c.city.toLowerCase() && (
                              <Check size={12} weight="bold" />
                            )}
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            defaultCity: 'All India',
                            defaultLocality: 'All India',
                            defaultLat: 20.5937,
                            defaultLon: 78.9629,
                          }));
                          setPreviewSelectedCity('All India');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                          config.defaultCity.toLowerCase() === 'all india'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>🇮🇳</span>
                        <span>All India (National)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Default City Name</label>
                      <input
                        type="text"
                        value={config.defaultCity}
                        onChange={(e) => {
                          setConfig((prev) => ({ ...prev, defaultCity: e.target.value }));
                          setPreviewSelectedCity(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="e.g. Agra, Delhi NCR, All India"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Default Locality / Suburb</label>
                      <input
                        type="text"
                        value={config.defaultLocality}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultLocality: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="e.g. Kamla Nagar or Agra"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Default Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={config.defaultLat}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultLat: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Default Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={config.defaultLon}
                        onChange={(e) => setConfig((prev) => ({ ...prev, defaultLon: Number(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
                    <Info size={18} weight="fill" className="text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-indigo-900 leading-relaxed">
                      Coordinates are used by the recommendation engine and LocationIQ to calculate academy distances (e.g. &quot;2.1 km from you&quot;) when GPS is unavailable.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MODAL COPY & ACTIONS */}
            {activeTab === 'copy_actions' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <PencilSimple size={20} weight="fill" className="text-emerald-600" />
                    Modal Copy &amp; Action Buttons
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Customize titles, descriptions, placeholders, and quick-action buttons in the modal.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Modal Header Title</label>
                    <input
                      type="text"
                      value={config.modalTitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, modalTitle: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. Choose Your Location"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Modal Subtitle / Value Proposition</label>
                    <input
                      type="text"
                      value={config.modalSubtitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, modalSubtitle: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g. Discover verified sports academies, coaches & creative labs across India"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Search Input Placeholder Text</label>
                    <input
                      type="text"
                      value={config.searchPlaceholder}
                      onChange={(e) => setConfig((prev) => ({ ...prev, searchPlaceholder: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* 1-Tap Quick Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="text-xs font-extrabold text-slate-900">
                      1-Tap Quick Action Buttons
                    </div>

                    {/* GPS Button Toggle & Label */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <NavigationArrow size={16} weight="fill" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900">GPS Auto-Detect Button</div>
                          <input
                            type="text"
                            value={config.gpsButtonLabel}
                            onChange={(e) => setConfig((prev) => ({ ...prev, gpsButtonLabel: e.target.value }))}
                            className="mt-1 text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                            placeholder="Button label"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, showGpsButton: !prev.showGpsButton }))}
                        className="cursor-pointer text-slate-800 transition-transform active:scale-90"
                      >
                        {config.showGpsButton ? (
                          <ToggleRight size={38} weight="fill" className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={38} weight="fill" className="text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* Pan-India Button Toggle & Label */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <GlobeHemisphereWest size={16} weight="fill" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900">Pan-India Button</div>
                          <input
                            type="text"
                            value={config.allIndiaButtonLabel}
                            onChange={(e) => setConfig((prev) => ({ ...prev, allIndiaButtonLabel: e.target.value }))}
                            className="mt-1 text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                            placeholder="Button label"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, showAllIndiaButton: !prev.showAllIndiaButton }))}
                        className="cursor-pointer text-slate-800 transition-transform active:scale-90"
                      >
                        {config.showAllIndiaButton ? (
                          <ToggleRight size={38} weight="fill" className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={38} weight="fill" className="text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CITIES & ORDERING */}
            {activeTab === 'city_arrangements' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <Buildings size={20} weight="fill" className="text-emerald-600" />
                      City Arrangements &amp; Sorting
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage which cities appear in the modal grid, badges, icons, and display order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCityModalState({
                        isOpen: true,
                        mode: 'add',
                        city: '',
                        state: '',
                        lat: 27.1767,
                        lon: 78.0081,
                        icon: '📍',
                        tag: '',
                        isActive: true,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus size={15} weight="bold" />
                    <span>Add City</span>
                  </button>
                </div>

                {/* Sort Mode Selector */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-extrabold text-slate-800">Sorting Mode for Modal Grid</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        mode: 'manual' as LocationSortMode,
                        title: 'Custom Order',
                        desc: 'Arranged via Move Up / Down buttons',
                      },
                      {
                        mode: 'alphabetical' as LocationSortMode,
                        title: 'Alphabetical (A–Z)',
                        desc: 'Sorts city names alphabetically',
                      },
                      {
                        mode: 'most_academies' as LocationSortMode,
                        title: 'Most Academies First',
                        desc: 'Dynamically sorted by centre count',
                      },
                    ].map((item) => (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, sortMode: item.mode }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          config.sortMode === item.mode
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-black flex items-center justify-between">
                          <span>{item.title}</span>
                          {config.sortMode === item.mode && (
                            <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* City List */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Configured Hubs ({config.cities.length})</span>
                    <span className="text-[11px] text-slate-400 font-normal">Use arrows to adjust order</span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {sortedCities.map((item, index) => {
                      const count = academyCounts[item.city] ?? 0;
                      const isDefault = config.defaultCity.toLowerCase() === item.city.toLowerCase();

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            item.isActive
                              ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 opacity-60'
                          }`}
                        >
                          {/* Reorder Arrows */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveCity(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp size={13} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCity(index, 'down')}
                              disabled={index === sortedCities.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown size={13} weight="bold" />
                            </button>
                          </div>

                          {/* Icon & City Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xl leading-none" role="img" aria-label={item.city}>
                              {item.icon || '📍'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {item.city}
                                </span>
                                {item.tag && (
                                  <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200">
                                    {item.tag}
                                  </span>
                                )}
                                {isDefault && (
                                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                    Default Landing
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                <span>{item.state}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">{count} Academies</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions: Active Toggle, Edit, Delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Toggle Active */}
                            <button
                              type="button"
                              onClick={() => handleToggleCityActive(item.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                item.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Hidden'}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setCityModalState({
                                  isOpen: true,
                                  mode: 'edit',
                                  cityId: item.id,
                                  city: item.city,
                                  state: item.state,
                                  lat: item.lat,
                                  lon: item.lon,
                                  icon: item.icon || '📍',
                                  tag: item.tag || '',
                                  isActive: item.isActive,
                                });
                              }}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                              title="Edit City"
                            >
                              <PencilSimple size={15} weight="bold" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteCityState({ isOpen: true, cityItem: item })}
                              className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete City"
                            >
                              <Trash size={15} weight="bold" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Live Interactive Modal Preview (5 Cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={18} weight="fill" className="text-emerald-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live Visitor Preview
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              {/* Device Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Desktop Preview"
                >
                  <Desktop size={15} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mobile Preview"
                >
                  <DeviceMobile size={15} weight="bold" />
                </button>
              </div>
            </div>

            {/* Preview Container Mockup */}
            <div
              className={`mx-auto bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[340px] text-[11px]' : 'w-full'
              }`}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 border-b border-emerald-100/60 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Compass size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {config.modalTitle || 'Choose Your Location'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {config.modalSubtitle || 'Discover verified sports academies & coaches'}
                    </p>
                  </div>
                </div>

                {config.isDismissible && (
                  <div className="p-1 rounded-lg bg-white/60 text-slate-400 text-xs shrink-0 cursor-default">
                    <X size={14} weight="bold" />
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3.5 max-h-[520px] overflow-y-auto">

                {/* 1-Tap Quick Actions */}
                {(config.showGpsButton || config.showAllIndiaButton) && (
                  <div className={`grid gap-2 ${config.showGpsButton && config.showAllIndiaButton ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {config.showGpsButton && (
                      <div
                        onClick={() => {
                          setPreviewSelectedCity('Agra (GPS)');
                          showToast("Preview: Auto-detected GPS location set.");
                        }}
                        className="p-2.5 rounded-xl border border-emerald-500/80 bg-emerald-50/70 hover:bg-emerald-100/80 transition-colors cursor-pointer flex items-center gap-2 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <NavigationArrow size={14} weight="fill" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black text-slate-900 truncate">
                            {config.gpsButtonLabel || 'Current Location'}
                          </div>
                          <div className="text-[8px] text-slate-500 truncate">
                            GPS Auto-detect
                          </div>
                        </div>
                      </div>
                    )}

                    {config.showAllIndiaButton && (
                      <div
                        onClick={() => {
                          setPreviewSelectedCity('All India');
                          showToast("Preview: Selected All India.");
                        }}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-2 group ${
                          previewSelectedCity.toLowerCase() === 'all india'
                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500/20'
                            : 'border-blue-300 bg-blue-50/70 hover:bg-blue-100/80'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <GlobeHemisphereWest size={14} weight="fill" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black text-slate-900 truncate">
                            {config.allIndiaButtonLabel || 'All India'}
                          </div>
                          <div className="text-[8px] text-slate-500 truncate">
                            Pan-India browse
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Bar Mockup */}
                <div className="relative">
                  <MagnifyingGlass size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder={config.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {/* Popular Coaching Hubs Grid */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Buildings size={12} weight="fill" className="text-emerald-600" />
                      Popular Coaching Hubs
                    </span>
                    <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      1-Click Select
                    </span>
                  </div>

                  <div className={`grid gap-1.5 ${previewDevice === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {sortedCities
                      .filter((c) => c.isActive)
                      .filter((c) => !previewSearch || c.city.toLowerCase().includes(previewSearch.toLowerCase()))
                      .map((c) => {
                        const isSelected = previewSelectedCity.toLowerCase() === c.city.toLowerCase();

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setPreviewSelectedCity(c.city);
                              showToast(`Preview selected: ${c.city}`);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-0.5">
                              <span className="text-base leading-none" role="img" aria-label={c.city}>
                                {c.icon || '📍'}
                              </span>
                              {isSelected ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                  <Check size={8} weight="bold" />
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400">Select</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-black text-slate-900 truncate">
                                {c.city}
                              </div>
                              <div className="text-[8px] text-slate-500 truncate">
                                {c.tag || c.state}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Preview Status Footer */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-slate-500 truncate">
                      Exploring: <strong className="text-slate-900">{previewSelectedCity || config.defaultCity}</strong>
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400">LocationIQ</span>
                </div>

              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              💡 Click city cards inside the preview to test interactive selection.
            </div>
          </div>

        </div>

      </div>

      {/* ADD / EDIT CITY MODAL */}
      {cityModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Buildings size={18} weight="fill" className="text-emerald-600" />
                {cityModalState.mode === 'add' ? 'Add New Coaching Hub' : 'Edit Coaching Hub'}
              </h3>
              <button
                type="button"
                onClick={() => setCityModalState((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSaveCityModal} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Icon / Emoji</label>
                  <input
                    type="text"
                    value={cityModalState.icon}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full text-center px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:bg-white focus:outline-none"
                    placeholder="🕌"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">City Name *</label>
                  <input
                    type="text"
                    required
                    value={cityModalState.city}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    placeholder="e.g. Varanasi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">State / Region</label>
                  <input
                    type="text"
                    value={cityModalState.state}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Badge / Tag</label>
                  <input
                    type="text"
                    value={cityModalState.tag}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    placeholder="e.g. Heritage Hub"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={cityModalState.lat}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, lat: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={cityModalState.lon}
                    onChange={(e) => setCityModalState((prev) => ({ ...prev, lon: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Show in Modal Grid</span>
                <button
                  type="button"
                  onClick={() => setCityModalState((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className="cursor-pointer"
                >
                  {cityModalState.isActive ? (
                    <ToggleRight size={36} weight="fill" className="text-emerald-600" />
                  ) : (
                    <ToggleLeft size={36} weight="fill" className="text-slate-300" />
                  )}
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCityModalState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white cursor-pointer shadow-xs"
                >
                  {cityModalState.mode === 'add' ? 'Add City' : 'Update City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmationModal
        isOpen={deleteCityState.isOpen}
        onCancel={() => setDeleteCityState({ isOpen: false, cityItem: null })}
        onConfirm={handleConfirmDeleteCity}
        title={`Remove ${deleteCityState.cityItem?.city || 'City'}?`}
        message={`Are you sure you want to remove ${deleteCityState.cityItem?.city} from the modal grid? You can always restore standard defaults later.`}
        confirmText="Remove City"
        cancelText="Cancel"
      />

      {/* CONFIRM RESTORE DEFAULTS MODAL */}
      <ConfirmationModal
        isOpen={resetConfirmOpen}
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restore Standard Location Defaults?"
        message="This will reset all location configurations (modal triggers, default landing hub, and city ordering) back to standard KnowUrCoach system defaults. All your current changes will be overwritten."
        confirmText="Restore Defaults"
        cancelText="Keep Current"
      />
    </div>
  );
}
