'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

interface Room { room_id: number; room_type: string; price: number; capacity: number; is_available: boolean; }
interface Hotel { hotel_id: number; name: string; address: string; location?: { name: string }; rooms?: Room[]; images?: string[]; }

export default function HostDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', location_id: '', description: '', star_rating: 3 });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && user.role !== 'HOST' && user.role !== 'ADMIN') { router.push('/'); return; }
    if (user) {
      fetchMyHotels();
      api.get('/locations').then(r => { if (r.data.success) setLocations(r.data.data); }).catch(() => {});
    }
  }, [user, authLoading]);

  const fetchMyHotels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hotels');
      if (response.data.success) {
        const myHotels = response.data.data.filter((h: any) => h.owner_id === user?.user_id);
        setHotels(myHotels.length > 0 ? myHotels : response.data.data);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingHotel(null);
    setFormData({ name: '', address: '', location_id: '', description: '', star_rating: 3 });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({ name: hotel.name, address: hotel.address, location_id: '', description: '', star_rating: 3 });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.address || !formData.location_id) { setFormError('Name, address and location are required'); return; }
    setFormLoading(true);
    try {
      if (editingHotel) {
        await api.put(`/hotels/${editingHotel.hotel_id}`, { ...formData, location_id: Number(formData.location_id), star_rating: Number(formData.star_rating) });
      } else {
        await api.post('/hotels', { ...formData, location_id: Number(formData.location_id), star_rating: Number(formData.star_rating) });
      }
      setShowModal(false);
      await fetchMyHotels();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save hotel');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/hotels/${id}`);
      setDeleteConfirm(null);
      await fetchMyHotels();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete hotel');
    }
  };

  const totalHotels = hotels.length;
  const totalRooms = hotels.reduce((acc, h) => acc + (h.rooms?.length || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light text-slate-900 min-h-screen font-display">
      {/* === Stitch Header: Host Admin Dashboard === */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xl">travel_explore</span>
              </div>
              <Link href="/" className="text-slate-900 text-xl font-extrabold tracking-tight">WebTravel</Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a className="text-primary text-sm font-semibold" href="#">Dashboard</a>
              <a className="text-slate-600 hover:text-primary text-sm font-semibold transition-colors" href="#">Analytics</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400">Property Manager</p>
            </div>
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'H'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 hidden md:flex flex-col p-6 sticky top-[65px] h-[calc(100vh-65px)] bg-white/70 backdrop-blur-md border-r border-primary/10">
          <div className="space-y-2 flex-1">
            <Link href="/host/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">domain</span><span>My Properties</span>
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary font-medium transition-all text-left"><span className="material-symbols-outlined">calendar_month</span><span>Bookings</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary font-medium transition-all text-left"><span className="material-symbols-outlined">payments</span><span>Earnings</span></button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary font-medium transition-all text-left"><span className="material-symbols-outlined">reviews</span><span>Guest Reviews</span></button>
          </div>
          <div className="pt-6 border-t border-primary/10 space-y-2">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 font-medium transition-all text-left">
              <span className="material-symbols-outlined">logout</span><span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Properties Overview</h1>
              <p className="text-slate-500 mt-1">Manage your hotel listings and room inventory.</p>
            </div>
            <button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <span className="material-symbols-outlined">add_circle</span> Add New Hotel
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: 'hotel', color: 'bg-primary/10 text-primary', label: 'Total Hotels', value: totalHotels },
              { icon: 'bed', color: 'bg-amber-500/10 text-amber-600', label: 'Total Rooms', value: totalRooms },
              { icon: 'check_circle', color: 'bg-emerald-500/10 text-emerald-600', label: 'Active Listings', value: totalHotels },
            ].map(s => (
              <div key={s.label} className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
                <div className={`size-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}><span className="material-symbols-outlined text-2xl">{s.icon}</span></div>
                <p className="text-slate-500 text-sm font-medium">{s.label}</p>
                <h3 className="text-3xl font-extrabold mt-1">{s.value}</h3>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-primary/5 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold">Active Properties</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Hotel Name</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Rooms</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {hotels.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hotels found. Create one to get started.</td></tr>
                  ) : hotels.map(hotel => (
                    <tr key={hotel.hotel_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                            <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80'} className="w-full h-full object-cover" alt={hotel.name} />
                          </div>
                          <Link href={`/hotels/${hotel.hotel_id}`} className="font-bold hover:text-primary transition-colors truncate max-w-[200px]">{hotel.name}</Link>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-600 text-sm">{hotel.location?.name || '---'}</td>
                      <td className="px-6 py-5 text-slate-600 text-sm">{hotel.rooms?.length || 0}</td>
                      <td className="px-6 py-5"><span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase">Active</span></td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(hotel)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                          <button onClick={() => setDeleteConfirm(hotel.hotel_id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><span className="material-symbols-outlined text-xl">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Hotel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && <p className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg">{formError}</p>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hotel Name *</label>
                <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. Azure Bay Resort" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address *</label>
                <input value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Full street address" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location *</label>
                <select value={formData.location_id} onChange={e => setFormData(f => ({ ...f, location_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">Select location...</option>
                  {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.name}, {loc.country}</option>)}
                </select>
              </div>
              {/* Star Rating: only for new hotel creation, not editable on existing hotels */}
              {!editingHotel && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Star Category</label>
                  <select value={formData.star_rating} onChange={e => setFormData(f => ({ ...f, star_rating: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">⭐ Guest review score is calculated automatically from reviews.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" placeholder="Describe your hotel..." />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70">
                  {formLoading ? 'Saving...' : (editingHotel ? 'Save Changes' : 'Create Hotel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="size-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-rose-500 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Hotel?</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. All rooms and data will be deleted.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
