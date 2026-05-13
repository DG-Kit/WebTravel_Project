'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  BOOKING_CONFIRMED: 'check_circle',
  BOOKING_CANCELLED: 'cancel',
  DEFAULT: 'notifications',
};

const TYPE_COLORS: Record<string, string> = {
  BOOKING_CONFIRMED: 'text-emerald-500 bg-emerald-50',
  BOOKING_CANCELLED: 'text-rose-500 bg-rose-50',
  DEFAULT: 'text-primary bg-primary/10',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async () => {
    setOpen(prev => !prev);
    // Mark all as read when opening
    if (!open && unreadCount > 0) {
      try {
        await api.put('/notifications/read-all');
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        // silent fail
      }
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative size-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h4 className="font-black text-slate-900">Notifications</h4>
            {notifications.some(n => !n.is_read) === false && (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">All read</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">notifications_off</span>
                <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const icon = TYPE_ICONS[notif.type] || TYPE_ICONS.DEFAULT;
                const color = TYPE_COLORS[notif.type] || TYPE_COLORS.DEFAULT;
                return (
                  <div
                    key={notif.notification_id}
                    className={`flex gap-3 px-5 py-4 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black ${!notif.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="size-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
