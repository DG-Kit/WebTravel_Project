'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

interface Booking {
  booking_id: string;
  hotel: {
    name: string;
    address: string;
    images: { image_url: string }[];
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string;
  booking_status: string;
  payment: {
    payment_status: string;
  };
}

export default function MyBookings() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('profile.bookings.cancelConfirm'))) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      showToast(t('profile.bookings.cancelSuccess'), 'success');
      fetchBookings();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel booking', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-sky-100 text-sky-700';
      case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-700';
      case 'CANCELLED': return 'bg-slate-200 text-slate-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ALL') return true;
    if (filter === 'CANCELLED') return b.booking_status === 'CANCELLED';
    if (filter === 'UPCOMING') return b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING_PAYMENT';
    if (filter === 'COMPLETED') return b.booking_status === 'COMPLETED' || b.booking_status === 'CONFIRMED' && new Date(b.check_out) < new Date();
    return true;
  });

  if (isLoading) return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('profile.bookings.title')}</h1>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap border ${
                filter === f
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white/50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f === 'ALL' ? t('profile.bookings.all') : t(`profile.bookings.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredBookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-500">{t('profile.bookings.noBookings')}</div>
        ) : (
          filteredBookings.map((booking) => (
            <article key={booking.booking_id} className="glass-card bg-white/70 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row gap-5 shadow-sm border border-slate-200 transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
              <div className="sm:w-48 h-32 sm:h-auto shrink-0 rounded-xl overflow-hidden relative bg-slate-200">
                {booking.hotel.images?.[0] ? (
                  <img src={booking.hotel.images[0].image_url} alt="Hotel" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{booking.hotel.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${getStatusColor(booking.booking_status)}`}>
                      {booking.booking_status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {booking.hotel.address}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                      {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                      {booking.guests} {t('profile.bookings.guests')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:w-40 shrink-0 flex flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-5 mt-2 sm:mt-0 py-1">
                <div className="text-right w-full flex sm:flex-col justify-between sm:justify-start items-center sm:items-end mb-4 sm:mb-0">
                  <div className="text-sm text-slate-500 font-medium">{t('profile.bookings.totalPrice')}</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">${Number(booking.total_price).toLocaleString()}</div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full">
                  {(booking.booking_status === 'PENDING_PAYMENT' || booking.booking_status === 'CONFIRMED') && (
                    <Link href={`/checkout/${booking.booking_id}`} className="flex-1 py-2 text-center bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full text-sm font-semibold transition-colors">
                      {booking.booking_status === 'PENDING_PAYMENT' ? t('profile.bookings.payNow') : t('profile.bookings.viewDetails')}
                    </Link>
                  )}
                  {booking.booking_status !== 'CANCELLED' && new Date(booking.check_in) > new Date() && (
                    <button onClick={() => handleCancel(booking.booking_id)} className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-full text-sm font-semibold transition-colors">
                      {t('profile.bookings.cancelBooking')}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
