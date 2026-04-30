'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function HostDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRooms: 0,
    totalBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch hotels owned by the host
        const response = await api.get(`/hotels?owner_id=${user?.user_id}`);
        if (response.data.success) {
          const hotels = response.data.data;
          const totalRooms = hotels.reduce((acc: number, h: any) => acc + (h.rooms?.length || 0), 0);
          
          setStats({
            totalHotels: hotels.length,
            totalRooms: totalRooms,
            totalBookings: 0, // TODO: Fetch from bookings API when ready
            totalEarnings: 0  // TODO: Calculate from bookings API
          });
        }
      } catch (error) {
        console.error('Failed to fetch host stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Performance Summary</h3>
        <p className="text-slate-500">Overview of your properties and business growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="hotel" label="Properties" value={stats.totalHotels} color="bg-blue-500" />
        <StatCard icon="bed" label="Total Rooms" value={stats.totalRooms} color="bg-emerald-500" />
        <StatCard icon="calendar_month" label="Bookings" value={stats.totalBookings} color="bg-amber-500" />
        <StatCard icon="payments" label="Earnings" value={`$${stats.totalEarnings.toLocaleString()}`} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Recent Bookings</h4>
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
            <p className="text-sm">No recent bookings found.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Property Performance</h4>
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">analytics</span>
            <p className="text-sm">Performance data will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`size-12 rounded-xl ${color} text-white flex items-center justify-center mb-4`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
    </div>
  );
}
