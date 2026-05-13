'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';

// Map amenity name keywords to specific Material Symbols icons
const AMENITY_ICONS: Record<string, string> = {
  'wi-fi': 'wifi',
  'wifi': 'wifi',
  'internet': 'wifi',
  'pool': 'pool',
  'swimming': 'pool',
  'spa': 'spa',
  'wellness': 'spa',
  'fitness': 'fitness_center',
  'gym': 'fitness_center',
  'restaurant': 'restaurant',
  'food': 'restaurant',
  'dining': 'restaurant',
  'breakfast': 'free_breakfast',
  'bar': 'local_bar',
  'parking': 'local_parking',
  'airport': 'local_airport',
  'transfer': 'airport_shuttle',
  'shuttle': 'airport_shuttle',
  'pet': 'pets',
  'beach': 'beach_access',
  'laundry': 'local_laundry_service',
  'concierge': 'concierge',
  'front desk': 'support_agent',
  '24': 'support_agent',
  'room service': 'room_service',
  'service': 'room_service',
  'air': 'ac_unit',
  'ac': 'ac_unit',
  'tv': 'tv',
  'television': 'tv',
  'safe': 'lock',
  'security': 'security',
  'business': 'business_center',
  'meeting': 'meeting_room',
  'kid': 'child_care',
  'children': 'child_care',
  'family': 'family_restroom',
  'garden': 'park',
  'terrace': 'deck',
  'balcony': 'balcony',
  'view': 'landscape',
};

function getAmenityIcon(amenity: any): string {
  const amenityName = typeof amenity === 'string' ? amenity : (amenity.amenity_name || '');
  const lower = amenityName.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'check_circle';
}

interface Room {
  room_id: number;
  room_type: string;
  price: number;
  capacity: number;
  is_available: boolean;
  images?: { image_url: string }[];
}

const TAG_DESCRIPTIONS: Record<string, { desc: { en: string; vi: string }; icon: string; color: string }> = {
  'Nature': { 
    desc: { en: 'Immerse yourself in nature with lush green spaces and fresh air.', vi: 'Hòa mình vào thiên nhiên với không gian xanh mát và không khí trong lành.' }, 
    icon: 'park', color: 'text-emerald-600 bg-emerald-50' 
  },
  'Romantic': { 
    desc: { en: 'Romantic atmosphere, ideal for couples and honeymoons.', vi: 'Không gian lãng mạn, lý tưởng cho các cặp đôi và kỳ nghỉ trăng mật.' }, 
    icon: 'favorite', color: 'text-rose-600 bg-rose-50' 
  },
  'Luxury': { 
    desc: { en: 'Experience premium, high-end service with top-tier amenities.', vi: 'Trải nghiệm dịch vụ cao cấp, sang trọng với tiện nghi bậc nhất.' }, 
    icon: 'diamond', color: 'text-amber-600 bg-amber-50' 
  },
  'Family-friendly': { 
    desc: { en: 'Fully equipped for the whole family, with safe play areas for children.', vi: 'Tiện nghi đầy đủ cho cả gia đình, có khu vui chơi an toàn cho trẻ em.' }, 
    icon: 'family_restroom', color: 'text-blue-600 bg-blue-50' 
  },
  'Budget': { 
    desc: { en: 'An economical choice with consistent service quality and affordable prices.', vi: 'Lựa chọn tiết kiệm với chất lượng dịch vụ ổn định và giá cả phải chăng.' }, 
    icon: 'payments', color: 'text-slate-600 bg-slate-100' 
  },
  'Adventure': { 
    desc: { en: 'For those who love exploring and vibrant outdoor activities.', vi: 'Dành cho những người yêu thích khám phá và các hoạt động ngoài trời sôi động.' }, 
    icon: 'landscape', color: 'text-orange-600 bg-orange-50' 
  },
  'Cultural': { 
    desc: { en: 'Discover the unique beauty of local culture and history.', vi: 'Khám phá nét đẹp văn hóa, lịch sử địa phương độc đáo.' }, 
    icon: 'account_balance', color: 'text-brown-600 bg-stone-100' 
  },
  'Beach': { 
    desc: { en: 'Enjoy a wonderful beach vacation with ocean views.', vi: 'Tận hưởng kỳ nghỉ tuyệt vời bên bờ biển với view hướng đại dương.' }, 
    icon: 'beach_access', color: 'text-cyan-600 bg-cyan-50' 
  },
  'Business': { 
    desc: { en: 'Fully equipped with facilities for work and important meetings.', vi: 'Trang bị đầy đủ tiện ích cho công việc và các cuộc họp quan trọng.' }, 
    icon: 'business_center', color: 'text-indigo-600 bg-indigo-50' 
  },
  'Sustainable': { 
    desc: { en: 'Committed to protecting the environment and developing sustainable tourism.', vi: 'Cam kết bảo vệ môi trường và phát triển du lịch bền vững.' }, 
    icon: 'eco', color: 'text-green-600 bg-green-50' 
  },
};

interface Hotel {
  hotel_id: number;
  name: string;
  address: string;
  description?: string;
  star_rating: number;
  average_rating: number;
  location?: { name: string; country: string };
  amenities?: any[]; 
  images?: any[];    
  tags?: { tag: { name: string } }[];
  rooms?: Room[];
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80';

export default function HotelDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { showToast } = useToast();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [bookingState, setBookingState] = useState({ checkIn: '', checkOut: '', guests: 2 });
  const [showGallery, setShowGallery] = useState(false);
  const [isBooking, setIsBooking] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchHotelDetails = async () => {
      try {
        const [hotelRes, reviewsRes] = await Promise.all([
          api.get(`/hotels/${id}`),
          api.get(`/hotels/${id}/reviews`).catch(() => ({ data: { data: [] } }))
        ]);
        if (hotelRes.data.success) {
          setHotel(hotelRes.data.data);
        } else {
          setError(hotelRes.data.message || t('hotel.notFound'));
        }
        // Convert BigInt review_id to string for safe rendering
        const rawReviews = reviewsRes.data?.data || [];
        setReviews(rawReviews.map((r: any) => ({ ...r, review_id: String(r.review_id) })));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };
    fetchHotelDetails();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    api.get(`/users/favorites`).then(res => {
      const favs = res.data?.data || [];
      // favorites return { hotel_id, hotel: {...} }
      setIsFavorite(favs.some((f: any) => f.hotel_id === Number(id) || f.hotel?.hotel_id === Number(id)));
    }).catch(() => {});
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user) { router.push('/login'); return; }
    setTogglingFav(true);
    try {
      if (isFavorite) {
        await api.delete(`/users/favorites/${id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/users/favorites`, { hotel_id: Number(id) })
          .then(() => setIsFavorite(true))
          .catch((err: any) => {
            // 409 = already saved → just mark as saved
            if (err.response?.status === 409) setIsFavorite(true);
            else console.error(err);
          });
      }
    } catch (e) { console.error(e); }
    finally { setTogglingFav(false); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setReviewError('');
    setSubmittingReview(true);
    try {
      const res = await api.post(`/hotels/${id}/reviews`, { rating: newRating, comment: newComment });
      if (res.data.success) {
        const newReview = { ...res.data.data, review_id: String(res.data.data.review_id) };
        setReviews(prev => [newReview, ...prev]);
        setNewComment('');
        setNewRating(5);
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  const handleBookRoom = async (roomId: number) => {
    if (!user) { router.push('/login'); return; }
    if (!bookingState.checkIn || !bookingState.checkOut) {
      showToast('Please select Check-in and Check-out dates first.', 'warning');
      return;
    }
    const checkInDate = new Date(bookingState.checkIn);
    const checkOutDate = new Date(bookingState.checkOut);
    if (checkOutDate <= checkInDate) {
      showToast('Check-out date must be after Check-in date.', 'warning');
      return;
    }

    setIsBooking(roomId);
    try {
      const res = await api.post('/bookings', {
        hotel_id: Number(id),
        check_in: bookingState.checkIn,
        check_out: bookingState.checkOut,
        guests: bookingState.guests,
        rooms: [{ room_id: roomId, quantity: 1 }]
      });
      if (res.data.success) {
        router.push(`/checkout/${res.data.data.booking_id}`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create booking', 'error');
    } finally {
      setIsBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">error_outline</span>
          <h2 className="text-2xl font-bold text-slate-700">{error || t('hotel.notFound')}</h2>
          <Link href="/explore" className="mt-4 inline-block text-primary font-semibold hover:underline">← {t('hotel.backToExplore')}</Link>
        </div>
      </div>
    );
  }

  // images is object[] from API: [{image_url: string}, ...]
  const hotelImageUrls = hotel.images?.map((img: any) => img.image_url) || [];
  
  const heroImages = hotelImageUrls.length > 0
    ? [...hotelImageUrls, FALLBACK_IMG, FALLBACK_IMG, FALLBACK_IMG].slice(0, 4)
    : [FALLBACK_IMG, FALLBACK_IMG, FALLBACK_IMG, FALLBACK_IMG];

  // amenities can be string[] (fallback) or object[] (from API)
  const amenities: any[] = hotel.amenities && hotel.amenities.length > 0
    ? hotel.amenities
    : ['Free Wi-Fi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Restaurant', '24/7 Front Desk'];

  const minPrice = hotel.rooms && hotel.rooms.length > 0
    ? Math.min(...hotel.rooms.map((r) => Number(r.price)))
    : null;

  const checkInDate = new Date(bookingState.checkIn);
  const checkOutDate = new Date(bookingState.checkOut);
  const nights = (bookingState.checkIn && bookingState.checkOut && checkOutDate > checkInDate)
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24))
    : 0;

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen">
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b">
            <h2 className="text-xl font-bold">{t('hotel.galleryTitle').replace('{name}', hotel.name)}</h2>
            <button 
              onClick={() => setShowGallery(false)}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="max-w-5xl mx-auto p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotelImageUrls.length > 0 ? hotelImageUrls.map((url, idx) => (
                <div key={idx} className={`rounded-2xl overflow-hidden bg-slate-100 ${idx === 0 ? 'md:col-span-2 aspect-video' : 'aspect-square'}`}>
                  <img src={url} alt={`${hotel.name} ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium">No photos available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removed redundant local header to use global Header component */}

      <main className="max-w-7xl mx-auto px-4 lg:px-10 py-8 w-full">
        {/* Hero masonry */}
        <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-[400px] md:h-[500px] mb-8 overflow-hidden rounded-2xl">
          <div onClick={() => setShowGallery(true)} className="md:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden bg-slate-200">
            <img src={heroImages[0]} alt="Hero 1" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
          </div>
          <div onClick={() => setShowGallery(true)} className="md:col-span-1 md:row-span-1 relative group cursor-pointer overflow-hidden bg-slate-200">
            <img src={heroImages[1]} alt="Hero 2" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
          <div onClick={() => setShowGallery(true)} className="md:col-span-1 md:row-span-1 relative group cursor-pointer overflow-hidden bg-slate-200">
            <img src={heroImages[2]} alt="Hero 3" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
          </div>
          <div onClick={() => setShowGallery(true)} className="md:col-span-2 md:row-span-1 relative group cursor-pointer overflow-hidden bg-slate-200">
            <img src={heroImages[3]} alt="Hero 4" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                <span className="material-symbols-outlined">grid_view</span> {t('hotel.viewAllPhotos')}
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Hotel Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{hotel.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-500">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                    <span className="text-sm font-medium">{hotel.address}, {hotel.location?.name}, {hotel.location?.country}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2">
                    <span className="font-bold text-lg">{hotel.average_rating || 'New'}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{Number(hotel.average_rating) > 4.5 ? t('hotel.excellent') : t('hotel.good')}</span>
                  </div>
                  {user && (
                    <button
                      onClick={toggleFavorite}
                      disabled={togglingFav}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all shadow-sm ${isFavorite ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-500'}`}
                    >
                      <span className="material-symbols-outlined text-lg leading-none">{isFavorite ? 'favorite' : 'favorite_border'}</span>
                      {isFavorite ? t('common.saved') : t('common.save')}
                    </button>
                  )}
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: hotel.star_rating || 5 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-base">star</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities chips */}
              <div>
                <h3 className="text-base font-bold text-slate-700 mb-3">{t('hotel.amenities')}</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-700 text-sm font-medium shadow-sm">
                      <span className="material-symbols-outlined text-primary text-base">{getAmenityIcon(amenity)}</span>
                      {typeof amenity === 'string' ? amenity : amenity.amenity_name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">{t('hotel.about')}</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{hotel.description || t('hotel.defaultDescription')}</p>
            </div>

            {/* Experience Tags Descriptions */}
            {hotel.tags && hotel.tags.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">{t('hotel.perfectFor')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotel.tags.map((t, idx) => {
                    const tagName = t.tag.name;
                    const config = TAG_DESCRIPTIONS[tagName] || { desc: 'Trải nghiệm dịch vụ tuyệt vời tại khách sạn này.', icon: 'star', color: 'text-slate-600 bg-slate-50' };
                    return (
                      <div key={idx} className={`p-5 rounded-2xl border border-transparent transition-all hover:shadow-md ${config.color.split(' ')[1]} flex items-start gap-4`}>
                        <div className={`p-3 rounded-xl bg-white shadow-sm ${config.color.split(' ')[0]}`}>
                          <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                        </div>
                        <div>
                          <h4 className={`font-bold text-lg ${config.color.split(' ')[0]}`}>{tagName}</h4>
                          <p className="text-slate-600 text-sm mt-1 leading-relaxed">{(config.desc as any)[language]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room Selection */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">{t('hotel.chooseRoom')}</h3>
              <div className="flex flex-col gap-4">
                {hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms.map((room) => (
                  <div key={room.room_id} className="glass-card group flex flex-col md:flex-row rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-200/50">
                    <div className="md:w-64 h-48 md:h-auto overflow-hidden relative bg-slate-200">
                      <img
                        src={room.images?.[0]?.image_url || FALLBACK_IMG}
                        alt={room.room_type}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{room.room_type}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">group</span> {room.capacity} {t('hotel.guests')}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">king_bed</span> 1 King Bed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">
                            ${nights > 0 ? (Number(room.price) * nights).toFixed(0) : Number(room.price).toFixed(0)}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {nights > 0 ? `${t('hotel.for')} ${nights} ${t('hotel.nights')}` : t('hotel.perNight')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                        <ul className="flex gap-4 text-xs font-semibold">
                          {room.is_available ? (
                            <li className="flex items-center gap-1 text-green-600"><span className="material-symbols-outlined text-sm">check_circle</span> {t('hotel.available')}</li>
                          ) : (
                            <li className="flex items-center gap-1 text-rose-500"><span className="material-symbols-outlined text-sm">cancel</span> {t('hotel.soldOut')}</li>
                          )}
                        </ul>
                        <button
                          onClick={() => handleBookRoom(room.room_id)}
                          disabled={!room.is_available || isBooking === room.room_id}
                          className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md ${room.is_available ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} flex items-center justify-center`}
                        >
                          {isBooking === room.room_id ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : t('hotel.selectRoom')}
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="glass-card rounded-2xl p-10 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block">hotel</span>
                    No rooms available for this hotel yet.
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">{t('hotel.guestReviews')} ({reviews.length})</h3>

              {/* Write a review */}
              {user ? (
                <form onSubmit={submitReview} className="glass-card p-6 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-900">Share Your Experience</h4>
                  {reviewError && <p className="text-sm text-rose-500 p-3 bg-rose-50 rounded-lg">{reviewError}</p>}
                  <div>
                    <label className="text-sm font-semibold text-slate-600 block mb-2">Your Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setNewRating(star)}
                          className={`material-symbols-outlined text-2xl transition-colors ${star <= newRating ? 'text-amber-400' : 'text-slate-200'}`}>
                          star
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 block mb-2">Comment</label>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={3}
                      placeholder="Tell others about your stay..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                    />
                  </div>
                  <button type="submit" disabled={submittingReview}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="glass-card p-6 rounded-2xl border border-slate-200/60 text-center">
                  <p className="text-slate-600 mb-4">Sign in to leave a review</p>
                  <Link href="/login" className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm inline-block">Sign In</Link>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.review_id} className="glass-card p-5 rounded-2xl border border-slate-200/60">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {review.user?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{review.user?.full_name || 'Traveler'}</p>
                            <p className="text-xs text-slate-400">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: Number(review.rating) }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-sm">star</span>
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm py-4">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 glass-card rounded-2xl p-6 border border-slate-200/50 shadow-xl space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm font-semibold text-slate-500">
                    {nights > 0 ? t('hotel.totalEstimated') : t('hotel.startingFrom')}
                  </span>
                  <h4 className="text-3xl font-black text-slate-900 leading-none mt-1">
                    {minPrice ? (nights > 0 ? `$${minPrice * nights}` : `$${minPrice}`) : '--'}
                    <span className="text-sm font-medium text-slate-500">
                      {nights > 0 ? ` / ${nights} ${t('hotel.nights')}` : `/${t('hotel.perNight')}`}
                    </span>
                  </h4>
                </div>
                <div className="flex gap-0.5 text-amber-400 text-sm">
                  {Array.from({ length: hotel.star_rating || 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base">star</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-white p-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Check-in</label>
                  <input type="date" value={bookingState.checkIn} onChange={e => setBookingState(s => ({ ...s, checkIn: e.target.value }))} className="w-full text-sm font-bold border-none p-0 focus:ring-0 bg-transparent outline-none" />
                </div>
                <div className="bg-white p-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Check-out</label>
                  <input type="date" value={bookingState.checkOut} onChange={e => setBookingState(s => ({ ...s, checkOut: e.target.value }))} className="w-full text-sm font-bold border-none p-0 focus:ring-0 bg-transparent outline-none" />
                </div>
                <div className="col-span-2 bg-white p-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Guests</label>
                  <select value={bookingState.guests} onChange={e => setBookingState(s => ({ ...s, guests: Number(e.target.value) }))} className="w-full text-sm font-bold border-none p-0 focus:ring-0 bg-transparent outline-none">
                    <option value={1}>1 {t('hotel.adult')}</option>
                    <option value={2}>2 {t('hotel.adults')}</option>
                    <option value={3}>2 {t('hotel.adults')}, 1 {t('hotel.child')}</option>
                    <option value={4}>2 {t('hotel.adults')}, 2 {t('hotel.children')}</option>
                  </select>
                </div>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-primary/30 active:scale-95"
                onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  if (!bookingState.checkIn || !bookingState.checkOut) {
                    showToast(t('hotel.selectDatesFirst'), 'warning');
                    return;
                  }
                  showToast(t('hotel.selectRoomBelow'), 'info');
                  window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
                }}
              >
                {t('hotel.checkAvailability')}
              </button>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium italic">{t('hotel.notChargedYet')}</p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/50 shadow-lg">
              <div className="h-48 bg-slate-200 flex items-center justify-center relative">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80" alt="Map" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white ring-4 ring-white/30 animate-pulse shadow-xl">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <span className="mt-2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-md">{t('hotel.viewOnMap')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global footer is provided by ConditionalLayout */}
    </div>
  );
}
