'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// Category to icon and color mapping
const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  'Nature': { icon: 'forest', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Landmark': { icon: 'account_balance', color: 'text-blue-600', bg: 'bg-blue-50' },
  'Cultural': { icon: 'museum', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Beach': { icon: 'beach_access', color: 'text-sky-600', bg: 'bg-sky-50' },
  'Adventure': { icon: 'landscape', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'default': { icon: 'place', color: 'text-primary', bg: 'bg-primary/10' },
};

const LOCATION_IMAGES: Record<string, string> = {
  'Da Nang': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
  'Maldives': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
};

const FALLBACK_BG = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80';

export default function LocationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [attractRes, hotelRes] = await Promise.all([
          api.get(`/attractions?location_id=${id}`),
          api.get(`/hotels?location_id=${id}`),
        ]);
        const allAttractions = attractRes.data?.data || [];
        const allHotels = hotelRes.data?.data || [];

        // Use first attraction's location info
        if (allAttractions.length > 0) {
          setLocation(allAttractions[0].location);
        } else if (allHotels.length > 0) {
          setLocation(allHotels[0].location);
        }

        setAttractions(allAttractions);
        setHotels(allHotels);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const heroImg = location ? (LOCATION_IMAGES[location.name] || FALLBACK_BG) : FALLBACK_BG;

  return (
    <div className="bg-background-light text-slate-900 font-display min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass flex items-center justify-between px-6 lg:px-12 py-4 border-b border-white/30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-primary/10 text-slate-600 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <Link href="/" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-2xl">explore</span>
            <span className="text-lg font-bold tracking-tight text-slate-900">WebTravel</span>
          </Link>
        </div>
        <Link href="/explore" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-base">chevron_left</span>
          Back to Explore
        </Link>
      </header>

      {/* Hero */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        <img src={heroImg} alt={location?.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
          <p className="text-sm font-bold uppercase tracking-widest text-primary/70 mb-1">{location?.country}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{location?.name || 'Destination'}</h1>
          <div className="flex gap-6 mt-3 text-sm font-medium text-white/80">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">tour</span>{attractions.length} Attractions</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">hotel</span>{hotels.length} Hotels</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 space-y-14">
        {/* Attractions */}
        {attractions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">tour</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Top Attractions</h2>
                <p className="text-slate-500 text-sm">Must-see places in {location?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {attractions.map((attraction: any) => {
                const meta = CATEGORY_META[attraction.category] || CATEGORY_META['default'];
                return (
                  <div key={attraction.attraction_id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    {/* Category banner */}
                    <div className={`px-5 py-3 flex items-center gap-2 ${meta.bg}`}>
                      <span className={`material-symbols-outlined text-xl ${meta.color}`}>{meta.icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{attraction.category}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{attraction.name}</h3>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0 ml-3">
                          <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                          <span className="text-amber-600 font-bold text-xs">{attraction.popularity_score?.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{attraction.description}</p>
                      {attraction.best_time_to_visit && (
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500 font-medium">
                          <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                          Best time: <span className="text-slate-700 font-semibold">{attraction.best_time_to_visit}</span>
                        </div>
                      )}
                      {attraction.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {attraction.tags.map((t: any) => (
                            <span key={t.tag_id} className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{t.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hotels */}
        {hotels.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">hotel</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Hotels &amp; Resorts</h2>
                <p className="text-slate-500 text-sm">Where to stay in {location?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {hotels.map((hotel: any) => (
                <Link href={`/hotels/${hotel.hotel_id}`} key={hotel.hotel_id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group block">
                  <div className="h-48 relative overflow-hidden bg-slate-200">
                    <img
                      src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-amber-500 font-bold text-xs shadow">
                      <span className="material-symbols-outlined text-xs">star</span>
                      {hotel.average_rating || 'New'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-slate-900 mb-1 truncate">{hotel.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                      {hotel.address}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-xs text-slate-400">From</span>
                        <p className="text-lg font-black text-primary">
                          {hotel.rooms?.[0]?.price ? `$${Number(hotel.rooms[0].price).toFixed(0)}` : '$--'}
                          <span className="text-xs text-slate-400 font-normal">/night</span>
                        </p>
                      </div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: hotel.star_rating || 5 }).map((_: any, i: number) => (
                          <span key={i} className="material-symbols-outlined text-sm">star</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {attractions.length === 0 && hotels.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 block">travel_explore</span>
            <p className="text-lg font-semibold">No content found for this destination yet.</p>
            <Link href="/explore" className="mt-4 inline-block text-primary font-bold hover:underline">← Back to Explore</Link>
          </div>
        )}
      </main>
    </div>
  );
}
