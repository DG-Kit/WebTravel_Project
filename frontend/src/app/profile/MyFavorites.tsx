'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Favorite {
  favorite_id: number;
  hotel: {
    hotel_id: number;
    name: string;
    address: string;
    star_rating: number;
    average_rating: number;
    images: { image_url: string }[];
    rooms: { price: number }[];
  };
}

export default function MyFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/users/favorites');
      if (res.data.success) {
        setFavorites(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (hotelId: number) => {
    try {
      await api.delete(`/users/favorites/${hotelId}`);
      setFavorites(prev => prev.filter(f => f.hotel.hotel_id !== hotelId));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Saved Hotels</h1>
        <p className="text-sm text-slate-500">Your collection of favorite properties.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
          <span className="material-symbols-outlined text-5xl mb-4 opacity-20">favorite_border</span>
          <p>You haven't saved any hotels yet.</p>
          <Link href="/explore" className="text-primary font-bold mt-4 inline-block hover:underline">Explore properties</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((fav) => {
            const hotel = fav.hotel;
            const minPrice = hotel.rooms && hotel.rooms.length > 0 
              ? Math.min(...hotel.rooms.map(r => Number(r.price))) 
              : null;
            
            return (
              <div key={fav.favorite_id} className="glass-card bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={hotel.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                  <button 
                    onClick={() => handleRemove(hotel.hotel_id)}
                    className="absolute top-3 right-3 size-8 bg-white/90 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                  </button>
                  {minPrice && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-primary">
                      From ${minPrice}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 line-clamp-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">
                      <span className="material-symbols-outlined text-[12px]">star</span>
                      {hotel.average_rating || 5.0}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {hotel.address}
                  </p>
                  <Link 
                    href={`/hotels/${hotel.hotel_id}`}
                    className="w-full py-2.5 text-center bg-slate-900 text-white rounded-xl text-sm font-bold block hover:bg-primary transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
