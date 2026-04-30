'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  hotel_id: number;
  name: string;
  address: string;
  star_rating: number;
  average_rating: number;
  is_active: boolean;
  owner: {
    full_name: string;
    email: string;
  };
  location: {
    name: string;
  };
}

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hotels');
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHotelStatus = async (hotelId: number, currentStatus: boolean) => {
    try {
      // TODO: Implement backend toggle for hotel status
      alert('Toggle status for hotel ' + hotelId);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">All Properties</h3>
          <p className="text-slate-500">Monitor and manage all hotel listings on the platform.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input type="text" placeholder="Search hotels..." className="outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Hotel Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hotels.map(hotel => (
              <tr key={hotel.hotel_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 text-sm">{hotel.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-xs">{hotel.address}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{hotel.location?.name}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{hotel.owner?.full_name}</div>
                  <div className="text-[10px] text-slate-400">{hotel.owner?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <span className="material-symbols-outlined text-xs">star</span>
                    {hotel.star_rating}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${hotel.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {hotel.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Link href={`/hotels/${hotel.hotel_id}`} target="_blank" className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </Link>
                      <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
