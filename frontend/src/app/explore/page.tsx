'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';

const LOCATION_FALLBACK_IMAGES: Record<string, string> = {
  'Tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
  'Da Nang': 'https://images.unsplash.com/photo-1559592490-34fa79075e1a?auto=format&fit=crop&w=1000&q=80',
  'Maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
  'Ha Noi': 'https://images.unsplash.com/rgP1_c9cwNg?auto=format&fit=crop&w=1000&q=80',
  'Ho Chi Minh City': 'https://images.unsplash.com/eilpDNi_pV4?auto=format&fit=crop&w=1000&q=80',
  'Da Lat': 'https://images.unsplash.com/_F03TiKqBMM?auto=format&fit=crop&w=1000&q=80',
  'Sapa': 'https://images.unsplash.com/WSwa5xY3K8Q?auto=format&fit=crop&w=1000&q=80',
  'Ha Long Bay': 'https://images.unsplash.com/aXVb-OcEGkg?auto=format&fit=crop&w=1000&q=80',
  'Ninh Binh': 'https://images.unsplash.com/EiieMLdJKik?auto=format&fit=crop&w=1000&q=80',
};

export default function ExplorePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [recommendedHotels, setRecommendedHotels] = useState<any[]>([]);
  const [hasPreferences, setHasPreferences] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [dbMetadata, setDbMetadata] = useState<{ countries: string[], amenities: string[], travelStyles: string[] }>({
    countries: [],
    amenities: [],
    travelStyles: []
  });
  const [itineraryModal, setItineraryModal] = useState<{ isOpen: boolean; data: any; locationName: string }>({ isOpen: false, data: null, locationName: '' });
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [recPageIndex, setRecPageIndex] = useState(0);

  // Pagination states
  const [destPage, setDestPage] = useState(1);
  const [hotelPage, setHotelPage] = useState(1);
  const DEST_PER_PAGE = 6;
  const HOTEL_PER_PAGE = 6;

  useEffect(() => {
    setIsMounted(true);
    const fetchMetadata = async () => {
      try {
        const response = await api.get('/hotels/metadata');
        if (response.data.success) setDbMetadata(response.data.data);
      } catch (error) { console.error('Failed to fetch metadata:', error); }
    };
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
    const fetchRecommended = async () => {
      if (!user) return;
      setLoadingRecommended(true);
      try {
        const response = await api.get('/recommendations');
        if (response.data.success) {
          setRecommendedHotels(response.data.data || []);
          setHasPreferences(response.data.hasPreferences);
        }
      } catch (error) { console.error('Failed to fetch recommendations:', error); }
      finally { setLoadingRecommended(false); }
    };

    fetchMetadata();
    fetchLocations();
    fetchHotels();
    fetchRecommended();
  }, [user]);

  // Client-side filtering
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      // Search query: match name, city, or country
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = hotel.name?.toLowerCase().includes(q);
        const matchLocation = hotel.location?.name?.toLowerCase().includes(q);
        const matchCountry = hotel.location?.country?.toLowerCase().includes(q);
        if (!matchName && !matchLocation && !matchCountry) return false;
      }

      // Country filter
      if (selectedCountry && hotel.location?.country !== selectedCountry) return false;

      // Travel style filter (Tags)
      if (selectedStyle) {
        const hasTag = (hotel.tags || []).some((t: any) => 
          (t.tag?.name || '').toLowerCase() === selectedStyle.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // Price filter: use first room price if available
      const price = Number(hotel.rooms?.[0]?.price ?? 0);
      if (price > 0 && (price < minPrice || price > maxPrice)) return false;

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hotelAmenities: string[] = (hotel.amenities || []).map((a: any) =>
          (a.amenity_name || '').toLowerCase()
        );
        const match = selectedAmenities.every(sel =>
          hotelAmenities.some(a => a.includes(sel.toLowerCase()))
        );
        if (!match) return false;
      }

      return true;
    });
  }, [hotels, searchQuery, selectedCountry, selectedStyle, minPrice, maxPrice, selectedAmenities]);

  const filteredLocations = useMemo(() => {
    let result = locations;
    if (selectedCountry) {
      result = result.filter(loc => loc.country === selectedCountry);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(loc =>
        loc.name?.toLowerCase().includes(q) || loc.country?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [locations, searchQuery, selectedCountry]);

  // Reset pagination when filters change
  useEffect(() => {
    setDestPage(1);
    setHotelPage(1);
  }, [searchQuery, selectedCountry, selectedStyle, minPrice, maxPrice, selectedAmenities]);

  const paginatedDestinations = useMemo(() => {
    const start = (destPage - 1) * DEST_PER_PAGE;
    return filteredLocations.slice(start, start + DEST_PER_PAGE);
  }, [filteredLocations, destPage]);

  const paginatedHotels = useMemo(() => {
    const start = (hotelPage - 1) * HOTEL_PER_PAGE;
    return filteredHotels.slice(start, start + HOTEL_PER_PAGE);
  }, [filteredHotels, hotelPage]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleGenerateItinerary = async (locationId: number, locationName: string) => {
    if (!user) {
      showToast(t('explore.signInToPlan'), 'warning');
      return;
    }
    setGeneratingItinerary(true);
    try {
      const response = await api.get(`/recommendations/itinerary/${locationId}`);
      if (response.data.success) {
        setItineraryModal({ isOpen: true, data: response.data.data, locationName });
      } else {
        showToast(response.data.message || t('explore.aiError'), 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || t('explore.itineraryGenFailed'), 'error');
    } finally {
      setGeneratingItinerary(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!itineraryModal.data) return;
    
    try {
      const locationId = locations.find(l => l.name === itineraryModal.locationName)?.location_id;
      if (!locationId) throw new Error('Location not found');

      const response = await api.post('/itineraries/save', {
        locationId,
        hotelId: itineraryModal.data.hotel.id || itineraryModal.data.hotel.hotel_id,
        itineraryData: itineraryModal.data
      });

      if (response.data.success) {
        showToast(t('explore.itinerarySaved'), 'success');
        setItineraryModal({ ...itineraryModal, isOpen: false });
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || t('explore.itinerarySaveFailed'), 'error');
    }
  };

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen">

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Search Section */}
        <div className="mb-10">
          <div className="glass p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/50 rounded-xl">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <input
                id="search-bar"
                suppressHydrationWarning
                className="bg-transparent border-none focus:ring-0 w-full text-sm font-medium placeholder:text-slate-400 outline-none"
                placeholder={t('explore.searchPlaceholder')}
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
                {t('explore.filters')}
              </h3>

              {/* Country Filter */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('explore.country')}</p>
                <select 
                  suppressHydrationWarning
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-white/60 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">All Countries</option>
                  {dbMetadata.countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Travel Style */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('explore.travelStyle')}</p>
                <div className="space-y-2">
                  <button
                    suppressHydrationWarning
                    onClick={() => setSelectedStyle('')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium
                      ${selectedStyle === ''
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-slate-600 hover:bg-white/60'}`}
                  >
                    <span className="material-symbols-outlined text-xl">explore</span>
                    <span>{t('explore.allStyles')}</span>
                  </button>
                  {dbMetadata.travelStyles.map(style => (
                    <button
                      key={style}
                      suppressHydrationWarning
                      onClick={() => setSelectedStyle(style)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium
                        ${selectedStyle === style
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-slate-600 hover:bg-white/60'}`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {style.toLowerCase().includes('adventure') ? 'landscape' : 
                         style.toLowerCase().includes('relax') ? 'beach_access' :
                         style.toLowerCase().includes('culture') ? 'account_balance' :
                         style.toLowerCase().includes('luxury') ? 'diamond' : 'star'}
                      </span>
                      <span>{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('explore.maxPrice')}</p>
                <div className="px-1">
                  <input
                    suppressHydrationWarning
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('explore.amenities')}</p>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {(dbMetadata.amenities.length > 0 ? dbMetadata.amenities : ['Wi-Fi', 'Pool', 'Spa', 'Restaurant', 'Gym']).map(amenity => (
                    <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          suppressHydrationWarning
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
              {(searchQuery || selectedStyle || selectedCountry || maxPrice < 5000 || selectedAmenities.length > 0) && (
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setSelectedStyle(''); 
                    setSelectedCountry('');
                    setMaxPrice(5000); 
                    setSelectedAmenities([]); 
                  }}
                  className="mt-6 w-full text-sm text-rose-500 font-semibold hover:bg-rose-50 py-2 rounded-lg transition-colors"
                >
                  {t('common.clearFilters')}
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-12">
            
            {/* AI Recommendation Section */}
            {user && (
              <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
                {!hasPreferences ? (
                  // CTA Banner for users without preferences
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-indigo-600 p-8 shadow-xl shadow-primary/20">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-amber-300">magic_button</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-white/80">AI Personalization</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('explore.tellUsWhatYouLove')}</h2>
                        <p className="text-white/80 text-sm max-w-md">{t('explore.tellUsSubtitle')}</p>
                      </div>
                      <Link href="/profile" className="px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-lg">
                        {t('explore.setPreferences')}
                      </Link>
                    </div>
                    {/* Background decorations */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] left-[10%] w-48 h-48 bg-primary/20 rounded-full blur-2xl"></div>
                  </div>
                ) : (
                  // Display AI Recommended Hotels
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-900">{t('common.recommendedForYou')}</h2>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{t('common.aiPowered')}</span>
                      </div>
                      <Link href="/profile" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        {t('common.editInterests')} <span className="material-symbols-outlined text-xs">edit</span>
                      </Link>
                    </div>
                    
                    {loadingRecommended ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2].map(i => <div key={i} className="h-40 bg-slate-200 rounded-3xl"></div>)}
                      </div>
                    ) : recommendedHotels.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 glass rounded-3xl">
                        <span className="material-symbols-outlined text-4xl block mb-2">search</span>
                        <p className="font-semibold text-sm">{t('explore.noHotelsMatch')}</p>
                        <p className="text-xs mt-1">{t('explore.noDestinations')}</p>
                      </div>
                    ) : (
                      <div className="relative group/slider">
                        <div className="overflow-hidden rounded-3xl">
                          <div 
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${recPageIndex * 100}%)` }}
                          >
                            {/* Grouping items by 3 for the slide effect */}
                            {Array.from({ length: Math.ceil(recommendedHotels.length / 3) }).map((_, pageIdx) => (
                              <div key={pageIdx} className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendedHotels.slice(pageIdx * 3, (pageIdx + 1) * 3).map(hotel => {
                                  // Find matching tags for "AI Insights"
                                  const userInterests = (user?.user_preferences?.preferred_categories || '') + ',' + (user?.user_preferences?.travel_style || '');
                                  const interestList = userInterests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
                                  const hotelTags = (hotel.tags || []).map((t: any) => (t.tag?.name || '').toLowerCase());
                                  const matchedTags = hotelTags.filter((tag: string) => interestList.some(interest => tag.includes(interest)));

                                  return (
                                    <Link href={`/hotels/${hotel.hotel_id}`} key={`rec-${hotel.hotel_id}`} className="flex flex-col p-4 glass rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-500 group relative bg-white/50 backdrop-blur-xl">
                                      {/* Match Score Badge */}
                                      {hotel.match_score > 0 && (
                                        <div className="absolute top-6 left-6 z-10 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1 animate-in fade-in zoom-in duration-700">
                                          <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                          {hotel.match_score}% MATCH
                                        </div>
                                      )}
                                      
                                      <div className="aspect-[16/10] rounded-[1.8rem] overflow-hidden mb-4 relative">
                                        <img alt={hotel.name} src={hotel.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      </div>

                                      <div className="flex-1 px-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5 text-primary">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{hotel.location?.name}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                            <span className="material-symbols-outlined text-sm">star</span> {hotel.average_rating || 'New'}
                                          </div>
                                        </div>

                                        <h4 className="font-black text-slate-900 text-lg mb-3 leading-tight group-hover:text-primary transition-colors">{hotel.name}</h4>
                                        
                                        {/* AI Insights - Highlighted matched features */}
                                        <div className="mb-4 flex flex-wrap gap-1.5">
                                          {matchedTags.slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-lg border border-primary/10 flex items-center gap-1">
                                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                              {tag}
                                            </span>
                                          ))}
                                          {matchedTags.length === 0 && (hotel.tags || []).slice(0, 2).map((t: any) => (
                                            <span key={t.tag.name} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                                              {t.tag.name}
                                            </span>
                                          ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{t('common.priceStartingAt')}</span>
                                            <span className="text-xl font-black text-primary">
                                              {hotel.rooms?.[0]?.price ? `$${Number(hotel.rooms[0].price).toFixed(0)}` : '$--'}
                                              <span className="text-xs text-slate-400 font-medium">/{t('common.night')}</span>
                                            </span>
                                          </div>
                                          <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all shadow-lg">
                                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                                {/* Add placeholders if needed on last page */}
                                {recommendedHotels.length % 3 !== 0 && pageIdx === Math.ceil(recommendedHotels.length / 3) - 1 && 
                                  Array.from({ length: 3 - (recommendedHotels.length % 3) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="hidden lg:block"></div>
                                  ))
                                }
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Navigation Dots */}
                        {recommendedHotels.length > 3 && (
                          <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.ceil(recommendedHotels.length / 3) }).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setRecPageIndex(idx)}
                                className={`size-2 rounded-full transition-all duration-300 ${recPageIndex === idx ? 'w-6 bg-primary' : 'bg-slate-200 hover:bg-slate-300'}`}
                                aria-label={`Go to page ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Optional: Prev/Next mini buttons that show on hover */}
                        {recommendedHotels.length > 3 && (
                          <>
                            <button 
                              onClick={() => setRecPageIndex(p => Math.max(0, p - 1))}
                              disabled={recPageIndex === 0}
                              className={`absolute left-[-20px] top-[40%] -translate-y-1/2 size-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all opacity-0 group-hover/slider:opacity-100 disabled:hidden z-10`}
                            >
                              <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button 
                              onClick={() => setRecPageIndex(p => Math.min(Math.ceil(recommendedHotels.length / 3) - 1, p + 1))}
                              disabled={recPageIndex === Math.ceil(recommendedHotels.length / 3) - 1}
                              className={`absolute right-[-20px] top-[40%] -translate-y-1/2 size-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all opacity-0 group-hover/slider:opacity-100 disabled:hidden z-10`}
                            >
                              <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Featured Destinations */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t('common.featuredDestinations')}</h2>
              </div>
              {loadingLocations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">{[1, 2].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>)}</div>
              ) : filteredLocations.length === 0 ? (
                <p className="text-slate-500 text-sm">{t('explore.noDestinations')}</p>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedDestinations.map(location => (
                      <div
                        key={location.location_id}
                        className="relative group h-64 rounded-3xl overflow-hidden shadow-lg transition-all duration-500"
                      >
                        <Link href={`/locations/${location.location_id}`} className="block h-full">
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
                        </div>
                        </Link>
                        
                        <div className="absolute bottom-6 right-6 flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleGenerateItinerary(location.location_id, location.name);
                            }}
                            className="bg-primary/20 hover:bg-primary backdrop-blur-md text-white p-2.5 rounded-xl transition-all flex items-center gap-2 group/btn z-10"
                            title="AI Magic Plan"
                          >
                            <span className="material-symbols-outlined text-xl">auto_awesome</span>
                            <span className="text-xs font-bold hidden group-hover/btn:block transition-all">{t('common.magicPlan')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Destinations */}
                  {filteredLocations.length > DEST_PER_PAGE && (
                    <div className="flex justify-center items-center gap-4">
                      <button 
                        onClick={() => setDestPage(p => Math.max(1, p - 1))}
                        disabled={destPage === 1}
                        className="size-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <span className="text-sm font-bold text-slate-600">{t('explore.page')} {destPage} {t('explore.of')} {Math.ceil(filteredLocations.length / DEST_PER_PAGE)}</span>
                      <button 
                        onClick={() => setDestPage(p => Math.min(Math.ceil(filteredLocations.length / DEST_PER_PAGE), p + 1))}
                        disabled={destPage === Math.ceil(filteredLocations.length / DEST_PER_PAGE)}
                        className="size-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Top Hotels */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('common.topHotels')}
                  {filteredHotels.length !== hotels.length && (
                    <span className="ml-3 text-sm font-normal text-slate-400">({filteredHotels.length} {t('common.results')})</span>
                  )}
                </h2>
              </div>
              {loadingHotels ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-200 rounded-3xl"></div>)}</div>
              ) : filteredHotels.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-3 block text-slate-300">search_off</span>
                  <p className="font-semibold">{t('explore.noHotelsMatch')}</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedStyle(''); setMaxPrice(5000); setSelectedAmenities([]); }} className="mt-4 text-primary font-bold hover:underline text-sm">{t('explore.clearFilters')}</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedHotels.map(hotel => (
                      <Link href={`/hotels/${hotel.hotel_id}`} key={hotel.hotel_id} className="glass rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block group">
                        <div className="h-48 relative overflow-hidden bg-slate-200">
                          <img
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            src={hotel.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
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
                              <span className="text-xs text-slate-400 font-medium">{t('common.priceStartingAt')}</span>
                              <span className="text-lg font-bold text-primary">
                                {hotel.rooms?.[0]?.price ? `$${Number(hotel.rooms[0].price).toFixed(0)}` : '$--'}
                                <span className="text-xs text-slate-400 font-normal">/{t('common.night')}</span>
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

                  {/* Pagination Hotels */}
                  {filteredHotels.length > HOTEL_PER_PAGE && (
                    <div className="flex justify-center items-center gap-4">
                      <button 
                        onClick={() => setHotelPage(p => Math.max(1, p - 1))}
                        disabled={hotelPage === 1}
                        className="size-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <span className="text-sm font-bold text-slate-600">{t('explore.page')} {hotelPage} {t('explore.of')} {Math.ceil(filteredHotels.length / HOTEL_PER_PAGE)}</span>
                      <button 
                        onClick={() => setHotelPage(p => Math.min(Math.ceil(filteredHotels.length / HOTEL_PER_PAGE), p + 1))}
                        disabled={hotelPage === Math.ceil(filteredHotels.length / HOTEL_PER_PAGE)}
                        className="size-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* AI Itinerary Modal */}
      {itineraryModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setItineraryModal({ ...itineraryModal, isOpen: false })}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{t('explore.magicItinerary')}</h3>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{itineraryModal.locationName}</p>
                </div>
              </div>
              <button onClick={() => setItineraryModal({ ...itineraryModal, isOpen: false })} className="size-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 italic text-amber-900 text-sm">
                "{itineraryModal.data?.destination_summary}"
              </div>

              {/* Accommodation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <span className="material-symbols-outlined text-primary">bed</span>
                  <h4 className="font-bold">{t('explore.accommodationSuggestion')}</h4>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                   <div className="size-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                     <img 
                        src={itineraryModal.data?.hotel.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'; }}
                     />
                   </div>
                   <div>
                     <p className="font-bold text-slate-900">{itineraryModal.data?.hotel.name}</p>
                     <p className="text-xs text-slate-500">{t('explore.basedOnPreferences')}</p>
                   </div>
                </div>
              </div>

              {/* Timeline */}
              {itineraryModal.data?.days.map((day: any) => (
                <div key={day.day} className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    <h4 className="font-bold">{t('profile.itineraries.day')} {day.day}</h4>
                  </div>
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20 ml-3">
                    {day.activities.map((act: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute left-[-11px] top-1.5 size-4 rounded-full bg-white border-4 border-primary"></div>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                          <span className="material-symbols-outlined text-sm">schedule</span> {act.time}
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{act.activity}</p>
                        <p className="text-xs text-slate-500 font-medium mb-1">@ {act.location}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{act.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={handleSaveItinerary}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">bookmark</span> Save to Itinerary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {generatingItinerary && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="relative size-24 mb-6">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">auto_awesome</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('explore.aiCrafting')}</h3>
          <p className="text-slate-500 font-medium mt-2">{t('explore.analyzing')}</p>
        </div>
      )}
    </div>
  );
}
