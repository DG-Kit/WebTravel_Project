'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');
  const [couponMsg, setCouponMsg] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        if (res.data.success) {
          setBooking(res.data.data);
          // Hydrate coupon if already applied (e.g. from a previous session)
          const existingCoupon = res.data.data.coupons?.[0];
          if (existingCoupon) {
            setAppliedCoupon({
              code: existingCoupon.coupon?.code ?? '',
              discount: parseFloat(String(existingCoupon.discount_amount ?? 0))
            });
            setCouponStatus('applied');
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking', err);
        alert('Booking not found or access denied');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id, router]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponStatus('loading');
    setCouponMsg('');
    try {
      // Validate coupon via a dedicated endpoint
      const res = await api.post('/bookings/validate-coupon', {
        coupon_code: couponInput.trim().toUpperCase(),
        booking_id: id,
      });
      if (res.data.success) {
        setAppliedCoupon({ code: res.data.data.code, discount: res.data.data.discount_amount });
        setCouponStatus('applied');
        setCouponMsg(`Coupon applied! You save $${res.data.data.discount_amount.toLocaleString()}`);
      }
    } catch (err: any) {
      setCouponStatus('error');
      setCouponMsg(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponStatus('idle');
    setCouponMsg('');
  };

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const res = await api.put(`/bookings/${id}/pay`, { payment_method: paymentMethod });
      if (res.data.success) {
        alert('Payment successful!');
        router.push('/profile');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;
  if (!booking) return null;

  // Safe parse
  const parseDate = (d: any) => d ? new Date(d) : null;
  const checkIn = parseDate(booking.check_in);
  const checkOut = parseDate(booking.check_out);
  const nights = (checkIn && checkOut && checkOut > checkIn)
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24))
    : 0;
  const hotel = booking.hotel;
  const total = typeof booking.total_price === 'number'
    ? booking.total_price
    : parseFloat(String(booking.total_price ?? 0));

  // Price breakdown: backend already stored discounted total_price
  // We display base = total / 0.9 * 0.9 approach is wrong — use actual data
  const discountAmount = appliedCoupon?.discount ?? 0;
  const subtotal = total + discountAmount;  // undiscounted base
  const tax = total * 0.1;
  const basePrice = total - tax;

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans text-slate-900">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/30 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-5xl mx-auto px-6 h-16">
          <div className="flex items-center gap-4 text-primary">
            <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white">
              <span className="material-symbols-outlined">explore</span>
            </div>
            <Link href="/" className="text-xl font-bold leading-tight tracking-tight text-slate-900">WebTravel</Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-6 mt-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-6 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Forms */}
          <div className="flex-1 flex flex-col gap-8">
            <section>
              <h1 className="text-2xl font-bold mb-2">Review your booking</h1>
              <p className="text-slate-500">Almost there! Please review your details before confirming.</p>
            </section>
            
            {/* Guest Information */}
            <section className="glass-card bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Guest Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                  <input className="w-full bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-200" readOnly type="text" value={user?.full_name || 'Guest'} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                  <input className="w-full bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-200" readOnly type="email" value={user?.email || ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Special Requests (Optional)</label>
                  <textarea className="w-full bg-white rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" placeholder="Late check-in, dietary requirements..." rows={2}></textarea>
                </div>
              </div>
            </section>

            {/* Coupon Code */}
            <section className="glass-card bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_offer</span>
                Promo / Coupon Code
              </h2>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="font-bold text-sm">{appliedCoupon.code}</span>
                    <span className="text-sm">— You save <strong>${appliedCoupon.discount.toLocaleString()}</strong></span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponStatus('idle'); setCouponMsg(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter coupon code (e.g. SUMMER20)"
                    className={`flex-1 rounded-lg px-4 py-2 text-sm border outline-none transition-colors ${
                      couponStatus === 'error' ? 'border-rose-400 focus:border-rose-400 bg-rose-50' : 'border-slate-300 focus:border-primary bg-white'
                    }`}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === 'loading' || !couponInput.trim()}
                    className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {couponStatus === 'loading'
                      ? <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      : 'Apply'}
                  </button>
                </div>
              )}

              {couponMsg && !appliedCoupon && (
                <p className={`mt-2 text-xs font-medium ${couponStatus === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {couponMsg}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">Coupon codes are case-insensitive and will be applied to your booking total.</p>
            </section>
            
            {/* Payment Method */}
            <section className="glass-card bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {/* Credit Card Option */}
                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border-2 ${paymentMethod === 'credit_card' ? 'border-primary bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <input 
                    checked={paymentMethod === 'credit_card'} 
                    onChange={() => setPaymentMethod('credit_card')}
                    className="text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                    name="payment" 
                    type="radio"
                  />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold">Credit Card (Simulated)</span>
                    <span className="material-symbols-outlined text-slate-400">credit_card</span>
                  </div>
                </label>
                
                {paymentMethod === 'credit_card' && (
                  <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Card Number</label>
                      <input className="w-full bg-white rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:border-primary outline-none" placeholder="0000 0000 0000 0000" type="text" defaultValue="4242 4242 4242 4242" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Expiry Date</label>
                        <input className="w-full bg-white rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:border-primary outline-none" placeholder="MM/YY" type="text" defaultValue="12/25" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CVC</label>
                        <input className="w-full bg-white rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:border-primary outline-none" placeholder="123" type="text" defaultValue="123" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Name on Card</label>
                      <input className="w-full bg-white rounded-lg px-4 py-2 text-sm text-slate-900 border border-slate-300 focus:border-primary outline-none" placeholder="Name" type="text" defaultValue={user?.full_name || ''} />
                    </div>
                  </div>
                )}
                
                {/* PayPal Option */}
                <label className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border-2 ${paymentMethod === 'paypal' ? 'border-primary bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <input 
                    checked={paymentMethod === 'paypal'} 
                    onChange={() => setPaymentMethod('paypal')}
                    className="text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                    name="payment" 
                    type="radio"
                  />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold">PayPal</span>
                  </div>
                </label>
              </div>
            </section>
          </div>
          
          {/* Right Column: Sticky Summary Card */}
          <div className="w-full lg:w-[380px]">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
              {/* Thumbnail Header */}
              <div className="h-48 relative bg-slate-200">
                {hotel.images?.[0] && (
                  <img src={hotel.images[0].image_url} alt="Hotel" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-1 drop-shadow-md">{hotel.name}</h3>
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {hotel.address}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col gap-6">
                {/* Dates */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Check-in</span>
                    <span className="text-sm font-bold text-slate-900">
                      {checkIn ? checkIn.toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Check-out</span>
                    <span className="text-sm font-bold text-slate-900">
                      {checkOut ? checkOut.toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
                
                {/* Price Breakdown */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-slate-900 mb-1">Price Details</h4>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{hotel.name} × {nights} nights</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">local_offer</span>
                        Coupon ({appliedCoupon?.code})
                      </span>
                      <span>−${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Taxes &amp; Fees (10%)</span>
                    <span>${tax.toLocaleString()}</span>
                  </div>
                  <hr className="border-slate-200 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-slate-900">Total</span>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-primary">${total.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Includes all taxes</span>
                    </div>
                  </div>
                </div>
                
                {/* CTA */}
                {booking.booking_status === 'PENDING_PAYMENT' ? (
                  <button 
                    onClick={handlePayment} 
                    disabled={isPaying}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPaying ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'Confirm & Pay Now'}
                  </button>
                ) : (
                  <div className="w-full bg-emerald-100 text-emerald-700 font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    Payment Completed
                  </div>
                )}
                
                <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Secure encrypted payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
