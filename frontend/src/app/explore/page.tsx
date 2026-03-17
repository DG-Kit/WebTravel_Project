'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const TRAVEL_STYLES = [
  { label: 'All', icon: 'explore', value: '' },
  { label: 'Adventure', icon: 'landscape', value: 'adventure' },
  { label: 'Relaxing', icon: 'beach_access', value: 'beach' },
  { label: 'Cultural', icon: 'account_balance', value: 'cultural' },
  { label: 'Luxury', icon: 'diamond', value: 'luxury' },
];

const LOCATION_FALLBACK_IMAGES: Record<string, string> = {
  'Da Nang': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1000&q=80',
  'Maldives': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
};

export default function ExplorePage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Wi-Fi']);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get('/locations');
        if (response.data.success) setLocations(response.data.data);
      } catch (error) { console.error('Failed to fetch locations:', error); }
      finally { setLoadingLocations(false); }
    };
    const fetchHotels = async () => {
      try {
        const response = await api.get('/hotels');
        if (response.data.success) setHotels(response.data.data);
      } catch (error) { console.error('Failed to fetch hotels:', error); }
      finally { setLoadingHotels(false); }
    };
    fetchLocations();
    fetchHotels();
  }, []);

  // Client-side filtering
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      // Search query: match name, location name, or country
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = hotel.name?.toLowerCase().includes(q);
        const matchLocation = hotel.location?.name?.toLowerCase().includes(q);
        const matchCountry = hotel.location?.country?.toLowerCase().includes(q);
        if (!matchName && !matchLocation && !matchCountry) return false;
      }

      // Price filter: use first room price if available
      const price = hotel.rooms?.[0]?.price ?? 0;
      if (price > 0 && (price < minPrice || price > maxPrice)) return false;

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hotelAmenities: string[] = (hotel.amenities || []).map((a: any) =>
          typeof a === 'string' ? a.toLowerCase() : (a.amenity_name || '').toLowerCase()
        );
        const match = selectedAmenities.every(sel =>
          hotelAmenities.some(a => a.includes(sel.toLowerCase()))
        );
        if (!match) return false;
      }

      return true;
    });
  }, [hotels, searchQuery, minPrice, maxPrice, selectedAmenities]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(loc =>
      loc.name?.toLowerCase().includes(q) || loc.country?.toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen">
      {/* === Stitch Header: Explore Destinations === */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">explore</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">WebTravel</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-primary font-semibold text-sm" href="#">Explore</a>
            <Link href="/bookings" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Bookings</Link>
            {user && <Link href="/profile" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Profile</Link>}
            {user && (user.role === 'HOST' || user.role === 'ADMIN') && (
              <Link href="/host/dashboard" className="text-primary font-bold text-sm border border-primary/20 bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-all">Host Dashboard</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-600 cursor-pointer" onClick={() => document.getElementById('search-bar')?.focus()}>
              <span className="material-symbols-outlined">search</span>
            </button>
            {user ? (
              <Link href="/profile" className="h-10 w-10 rounded-full bg-primary/20 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center text-primary font-bold text-sm">
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link href="/login" className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Search Section */}
        <div className="mb-10">
          <div className="glass p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/50 rounded-xl">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <input
                id="search-bar"
                className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium placeholder:text-slate-400 outline-none"
                placeholder="Search by Country, City, or Hotel"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-6 shrink-0">
            <div className="glass p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">filter_list</span>
                Filters
              </h3>

              {/* Travel Style */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Travel Style</p>
                <div className="space-y-2">
                  {TRAVEL_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(style.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium
                        ${selectedStyle === style.value
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-slate-600 hover:bg-white/60'}`}
                    >
                      <span className="material-symbols-outlined text-xl">{style.icon}</span>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Max Price/Night</p>
                <div className="px-1">
                  <input
                    type="range"
                    min={50}
                    max={5000}
                    step={50}
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-xs font-bold text-slate-600">
                    <span>$0</span>
                    <span className="text-primary">${maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amenities</p>
                <div className="space-y-3">
                  {['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Gym'].map(amenity => (
                    <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 checked:bg-primary checked:border-primary transition-all"
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                        />
                        <span className="material-symbols-outlined text-white text-sm absolute opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(searchQuery || selectedStyle || maxPrice < 5000 || selectedAmenities.length > 0) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedStyle(''); setMaxPrice(5000); setSelectedAmenities([]); }}
                  className="mt-6 w-full text-sm text-rose-500 font-semibold hover:bg-rose-50 py-2 rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-10">
            {/* Featured Destinations */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Featured Destinations</h2>
              </div>
              {loadingLocations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">{[1, 2].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>)}</div>
              ) : filteredLocations.length === 0 ? (
                <p className="text-slate-500 text-sm">No destinations match your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredLocations.map(location => (
                    <Link
                      key={location.location_id}
                      href={`/locations/${location.location_id}`}
                      className="relative group h-64 rounded-3xl overflow-hidden shadow-lg cursor-pointer block"
                    >
                      <img
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        src={location.image_url || LOCATION_FALLBACK_IMAGES[location.name] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute inset-0 flex items-end justify-between p-6">
                        <div className="text-white">
                          <p className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-1">{location.country}</p>
                          <h3 className="text-2xl font-bold">{location.name}</h3>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                          <span className="material-symbols-outlined text-white text-xl">arrow_forward</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Top Hotels */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Top Hotels &amp; Resorts
                  {filteredHotels.length !== hotels.length && (
                    <span className="ml-3 text-sm font-normal text-slate-400">({filteredHotels.length} results)</span>
                  )}
                </h2>
              </div>
              {loadingHotels ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-200 rounded-3xl"></div>)}</div>
              ) : filteredHotels.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-3 block text-slate-300">search_off</span>
                  <p className="font-semibold">No hotels match your filters.</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedStyle(''); setMaxPrice(5000); setSelectedAmenities([]); }} className="mt-4 text-primary font-bold hover:underline text-sm">Clear filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredHotels.map(hotel => (
                    <Link href={`/hotels/${hotel.hotel_id}`} key={hotel.hotel_id} className="glass rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block group">
                      <div className="h-48 relative overflow-hidden bg-slate-200">
                        <img
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'; }}
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-amber-500 font-bold text-xs shadow-sm">
                          <span className="material-symbols-outlined text-xs">star</span> {hotel.average_rating || 'New'}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-tighter mb-2">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {hotel.location?.name || 'Unknown'}, {hotel.location?.country || ''}
                        </div>
                        <h4 className="font-bold text-slate-900 mb-3 truncate">{hotel.name}</h4>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium">Starting at</span>
                            <span className="text-lg font-bold text-primary">
                              {hotel.rooms?.[0]?.price ? `$${Number(hotel.rooms[0].price).toFixed(0)}` : '$--'}
                              <span className="text-xs text-slate-400 font-normal">/night</span>
                            </span>
                          </div>
                          <button className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white p-2 rounded-xl transition-all">
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
