'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHotels: 0,
    totalLocations: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        // Parallel fetch for global data
        const [usersRes, hotelsRes, locationsRes] = await Promise.all([
          api.get('/users'), // Need to ensure this exists/protected
          api.get('/hotels'),
          api.get('/locations')
        ]);

        setStats({
          totalUsers: usersRes.data.count || 0,
          totalHotels: hotelsRes.data.count || 0,
          totalLocations: locationsRes.data.count || 0,
          totalBookings: 0 // TODO: Add bookings API
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
  }, []);

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
        <h3 className="text-2xl font-bold text-slate-900">Platform Overview</h3>
        <p className="text-slate-500">Monitor system-wide activity and metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="group" label="Total Users" value={stats.totalUsers} color="bg-indigo-600" />
        <StatCard icon="hotel" label="Active Hotels" value={stats.totalHotels} color="bg-emerald-600" />
        <StatCard icon="location_on" label="Destinations" value={stats.totalLocations} color="bg-sky-600" />
        <StatCard icon="confirmation_number" label="Bookings" value={stats.totalBookings} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-6">System Health</h4>
          <div className="space-y-4">
             <HealthRow label="API Server" status="Healthy" />
             <HealthRow label="Database (SQL Server)" status="Healthy" />
             <HealthRow label="Storage Service" status="Healthy" />
             <HealthRow label="Auth Service" status="Healthy" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Pending Approvals</h4>
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">fact_check</span>
            <p className="text-sm">No pending items.</p>
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

function HealthRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
        {status}
      </span>
    </div>
  );
}
