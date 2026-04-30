'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  hotel_id: number;
  name: string;
  address: string;
  star_rating: number;
  average_rating: number;
  is_active: boolean;
  images: string[];
}

export default function HostHotelsPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyHotels();
  }, [user]);

  const fetchMyHotels = async () => {
    try {
      setLoading(true);
      // STRICT FILTERING: Only fetch hotels owned by the current user
      const response = await api.get(`/hotels?owner_id=${user?.user_id}`);
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">My Properties</h3>
          <p className="text-slate-500">Manage your hotel listings and room availability.</p>
        </div>
        <Link href="/host/hotels/new" className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
          <span className="material-symbols-outlined">add_business</span>
          Add New Hotel
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <span className="material-symbols-outlined text-5xl">hotel</span>
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">No properties yet</h4>
          <p className="text-slate-500 mb-8">Start your journey by adding your first hotel listing.</p>
          <Link href="/host/hotels/new" className="text-primary font-bold hover:underline">Create a listing now &rarr;</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {hotels.map(hotel => (
            <div key={hotel.hotel_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow">
              <div className="w-full md:w-72 h-48 md:h-auto bg-slate-100 relative shrink-0">
                <img 
                  src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={hotel.name} 
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-amber-500 font-bold text-xs shadow-sm">
                  <span className="material-symbols-outlined text-xs">star</span> {hotel.star_rating}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-slate-900">{hotel.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${hotel.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {hotel.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {hotel.address}
                  </p>
                  
                  <div className="flex gap-8">
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rooms</p>
                        <p className="font-bold text-slate-900">12</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Rating</p>
                        <p className="font-bold text-slate-900">{hotel.average_rating}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Bookings</p>
                        <p className="font-bold text-slate-900">0</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                   <div className="flex gap-2">
                      <Link href={`/host/hotels/${hotel.hotel_id}/edit`} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit Details
                      </Link>
                      <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">bed</span>
                        Manage Rooms
                      </button>
                   </div>
                   <Link href={`/hotels/${hotel.hotel_id}`} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                     View Listing <span className="material-symbols-outlined text-sm">open_in_new</span>
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
