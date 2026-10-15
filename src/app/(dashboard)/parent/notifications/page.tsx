"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePersona } from '@/context/PersonaContext';
import { GeneralCoachPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  Bell,
  CheckCircle,
  Ticket,
  CalendarBlank,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Trash,
  CreditCard,
  User,
  TennisBall,
} from '@phosphor-icons/react';

export default function ParentNotificationsPage() {
  const { notifications, unreadCount, markAllNotificationsRead, refreshNotifications, showToast } = usePersona();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshNotifications().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    showToast('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'kyc':
        return <ShieldCheck size={20} weight="fill" className="text-blue-600" />;
      case 'subscription':
        return <CreditCard size={20} weight="fill" className="text-purple-600" />;
      case 'lead':
        return <User size={20} weight="fill" className="text-emerald-600" />;
      case 'booking':
        return <TennisBall size={20} weight="fill" className="text-amber-600" />;
      case 'competition':
        return <Trophy size={20} weight="fill" className="text-orange-600" />;
      default:
        return <Bell size={20} weight="fill" className="text-blue-600" />;
    }
  };

  const formatRelativeTime = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return <GeneralCoachPageSkeleton title="Notifications Center" />;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20 md:pb-12 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bell size={24} weight="fill" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Notifications Center
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {unreadCount > 0 ? `${unreadCount} unread updates` : 'You are all caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => {
              const isUnread = !n.isRead;

              return (
                <div
                  key={n.id}
                  className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                    isUnread
                      ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                      : 'bg-white border-slate-200/80 shadow-2xs opacity-90'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900">{n.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {n.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No New Notifications</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Session booking confirmations, coach attendance updates, and safety alerts will be posted here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
