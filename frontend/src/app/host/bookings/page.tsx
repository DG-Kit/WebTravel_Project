'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { format } from 'date-fns';

interface Booking {
  booking_id: string;
  hotel: {
    name: string;
    address: string;
    images: { image_url: string }[];
  };
  user: {
    full_name: string;
    email: string;
    phone: string;
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  booking_status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  details: any[];
  payment?: {
    payment_status: string;
    payment_method: string;
  };
}

const STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-600 border-amber-100',
  PAID: 'bg-blue-50 text-blue-600 border-blue-100',
  CONFIRMED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  COMPLETED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
};

export default function HostBookingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/host');
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.booking_id.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id: string, action: 'confirm' | 'cancel') => {
    try {
      const endpoint = action === 'confirm' ? `/bookings/${id}/confirm` : `/bookings/${id}/cancel`;
      const response = await api.put(endpoint);
      if (response.data.success) {
        showToast(action === 'confirm' ? 'Booking confirmed!' : 'Booking cancelled', 'success');
        fetchBookings();
        if (selectedBooking?.booking_id === id) {
          setShowDetails(false);
        }
      }
    } catch (err: any) {
      console.error(`Error ${action} booking:`, err);
      showToast(err.response?.data?.message || `Failed to ${action} booking`, 'error');
    }
  };

  const getStats = () => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.booking_status === 'CONFIRMED').length;
    const pendingPayment = bookings.filter(b => b.booking_status === 'PENDING_PAYMENT').length;
    const awaitingConfirm = bookings.filter(b => b.booking_status === 'PAID').length;
    const revenue = bookings
      .filter(b => b.booking_status !== 'CANCELLED' && b.booking_status !== 'PENDING_PAYMENT')
      .reduce((sum, b) => sum + Number(b.total_price), 0);
    return { total, confirmed, pendingPayment, awaitingConfirm, revenue };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
        </div>
        <div className="h-[600px] bg-slate-50 rounded-4xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-0 font-display">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bookings</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="size-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Payment</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.pendingPayment}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-blue-400">
          <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
            <span className="material-symbols-outlined">mark_email_read</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Confirm</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.awaitingConfirm}</p>
          {stats.awaitingConfirm > 0 && (
            <p className="text-[10px] text-blue-500 font-bold mt-1 animate-pulse">● Action required</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <p className="text-2xl font-black text-slate-900 mt-1">${stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Reservations</h3>
            <p className="text-xs text-slate-400 font-medium">Review and manage all incoming guest bookings.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search bookings..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-sm text-slate-900 transition-all w-full md:w-64"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-6 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-sm text-slate-900 transition-all cursor-pointer appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAID">Paid (Wait Confirm)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Guest / ID</th>
                <th className="px-8 py-5">Property</th>
                <th className="px-8 py-5">Check In - Out</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <span className="material-symbols-outlined text-4xl">event_busy</span>
                    </div>
                    <p className="text-slate-400 font-bold">No bookings found</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.booking_id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900">{booking.user.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{booking.booking_id.slice(-8)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-700 text-sm">{booking.hotel.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{booking.hotel.address}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 3600 * 24))} nights
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-base font-black text-slate-900">${Number(booking.total_price).toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Payment: {booking.payment?.payment_status || 'N/A'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[booking.booking_status]}`}>
                        {booking.booking_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.booking_status === 'PAID' && (
                          <button 
                            onClick={() => handleStatusUpdate(booking.booking_id, 'confirm')}
                            className="size-11 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center shadow-sm"
                            title="Confirm Reservation"
                          >
                            <span className="material-symbols-outlined">check</span>
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedBooking(booking); setShowDetails(true); }}
                          className="size-11 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center group-hover:scale-110 active:scale-95 shadow-sm"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">info</span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Booking Details</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Order ID #{selectedBooking.booking_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetails(false)} 
                className="size-12 hover:bg-white rounded-2xl transition-all text-slate-400 shadow-sm flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
               {/* Guest Info */}
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Information</p>
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black">
                              {selectedBooking.user.full_name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-black text-slate-900">{selectedBooking.user.full_name}</p>
                              <p className="text-xs text-slate-500">{selectedBooking.user.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-4">
                           <span className="material-symbols-outlined text-sm">phone</span>
                           {selectedBooking.user.phone || 'No phone provided'}
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stay Duration</p>
                     <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">Check In</span>
                           <span className="text-sm font-black text-slate-900">{format(new Date(selectedBooking.check_in), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">Check Out</span>
                           <span className="text-sm font-black text-slate-900">{format(new Date(selectedBooking.check_out), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">Total Nights</span>
                           <span className="text-sm font-black text-primary uppercase tracking-widest">
                             {Math.ceil((new Date(selectedBooking.check_out).getTime() - new Date(selectedBooking.check_in).getTime()) / (1000 * 3600 * 24))} nights
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Hotel & Rooms */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room Selection</p>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 flex gap-6 shadow-sm">
                     {selectedBooking.hotel.images?.[0] && (
                       <img 
                        src={selectedBooking.hotel.images[0].image_url} 
                        className="size-24 rounded-2xl object-cover" 
                        alt=""
                       />
                     )}
                     <div className="flex-1 flex flex-col justify-center">
                        <h5 className="font-black text-lg text-slate-900">{selectedBooking.hotel.name}</h5>
                        <p className="text-xs text-slate-500 font-medium mb-3">{selectedBooking.hotel.address}</p>
                        <div className="flex flex-wrap gap-2">
                           {selectedBooking.details.map((d: any, i: number) => (
                             <span key={i} className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-lg">
                               {d.quantity}x {d.room?.room_type}
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Pricing */}
               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Price</p>
                    <p className="text-3xl font-black">${Number(selectedBooking.total_price).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10`}>
                      {selectedBooking.booking_status.replace('_', ' ')}
                    </span>
                  </div>
               </div>

               {/* Actions */}
               {(selectedBooking.booking_status === 'PENDING_PAYMENT' || selectedBooking.booking_status === 'PAID') && (
                  <div className="flex gap-4">
                     <button 
                       onClick={() => handleStatusUpdate(selectedBooking.booking_id, 'cancel')}
                       className="flex-1 py-4 rounded-2xl bg-rose-50 text-rose-500 font-black text-sm hover:bg-rose-100 transition-all active:scale-95"
                     >
                       Decline
                     </button>
                     {selectedBooking.booking_status === 'PAID' && (
                       <button 
                         onClick={() => handleStatusUpdate(selectedBooking.booking_id, 'confirm')}
                         className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                       >
                         Confirm Reservation
                       </button>
                     )}
                     {selectedBooking.booking_status === 'PENDING_PAYMENT' && (
                       <p className="flex-1 flex items-center justify-center text-xs text-amber-600 font-bold bg-amber-50 rounded-2xl px-4 text-center">
                         Awaiting Guest Payment
                       </p>
                     )}
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
