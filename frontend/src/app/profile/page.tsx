'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';

const TRAVEL_STYLES = [
  { id: 'Adventure', icon: 'hiking', label: 'Adventure' },
  { id: 'Relaxing', icon: 'spa', label: 'Relaxing' },
  { id: 'Cultural', icon: 'museum', label: 'Cultural' },
  { id: 'Budget', icon: 'payments', label: 'Budget' },
  { id: 'Luxury', icon: 'diamond', label: 'Luxury' }
];

const SEASONS = [
  { id: 'Summer', icon: 'sunny', label: 'Summer' },
  { id: 'Winter', icon: 'ac_unit', label: 'Winter' },
  { id: 'Spring', icon: 'eco', label: 'Spring' },
  { id: 'Autumn', icon: 'eco', label: 'Autumn' }
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, updateUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.user_preferences) {
        setSelectedStyles(user.user_preferences.travel_style ? user.user_preferences.travel_style.split(',') : []);
        setSelectedSeasons(user.user_preferences.preferred_categories ? user.user_preferences.preferred_categories.split(',') : []);
      }
    }
  }, [user]);

  const toggleStyle = (id: string) => setSelectedStyles(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSeason = (id: string) => setSelectedSeasons(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const handleSave = async () => {
    setError(''); setIsSaving(true);
    try {
      const payload = {
        full_name: fullName, phone,
        preferences: { travel_style: selectedStyles.join(','), preferred_categories: selectedSeasons.join(',') }
      };
      const response = await api.put('/users/profile', payload);
      if (response.data.success) {
        updateUser({ full_name: fullName, phone, user_preferences: { ...user?.user_preferences, ...payload.preferences } });
        showToast('Profile updated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setIsSaving(false); }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light ">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light  text-slate-900  min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        {/* === Stitch Header: User Profile & Dashboard === */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white/80  backdrop-blur-md px-6 md:px-20 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-4 text-primary">
            <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white">
              <span className="material-symbols-outlined">explore</span>
            </div>
            <Link href="/" className="text-slate-900  text-xl font-bold leading-tight tracking-tight">WebTravel</Link>
          </div>
          <div className="flex flex-1 justify-end gap-6 items-center">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/explore" className="text-slate-600  hover:text-primary transition-colors text-sm font-medium">Explore</Link>
              <Link href="/bookings" className="text-slate-600  hover:text-primary transition-colors text-sm font-medium">Bookings</Link>
              <Link href="/profile" className="text-primary text-sm font-semibold">Profile</Link>
              <a className="text-slate-600  hover:text-primary transition-colors text-sm font-medium" href="#">Settings</a>
            </nav>
            <div className="h-8 w-px bg-slate-200  hidden md:block"></div>
            <button className="flex cursor-pointer items-center justify-center rounded-full h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button onClick={logout} className="h-10 w-10 rounded-full ring-2 ring-primary/20 bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all" title="Logout">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Overview */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 ring-4 ring-white shadow-lg bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary">person</span>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900 ">{user.full_name || 'Traveler'}</h3>
                  <p className="text-slate-500  text-sm">{user.email}</p>
                </div>
                <div className="mt-6 w-full pt-6 border-t border-slate-100  flex justify-around">
                  <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trips</p><p className="text-lg font-bold text-primary">0</p></div>
                  <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved</p><p className="text-lg font-bold text-primary">0</p></div>
                  <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</p><p className="text-lg font-bold text-primary capitalize">{user.role?.toLowerCase()}</p></div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900  mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm">verified_user</span><span className="text-sm text-slate-600 ">Verified Explorer</span></div>
                  <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm">calendar_today</span><span className="text-sm text-slate-600 ">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</span></div>
                </div>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-8">
              {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>}
              <section className="glass-card rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 ">Edit Profile</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 ">Full Name</label>
                    <input className="form-input rounded-lg border-slate-200  bg-white/50  focus:border-primary focus:ring-primary outline-none transition-all p-3 text-slate-900 " type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 ">Email Address (Read only)</label>
                    <input className="form-input rounded-lg border-slate-200 bg-slate-100  text-slate-500 cursor-not-allowed outline-none p-3" type="email" value={email} readOnly />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 ">Phone Number</label>
                    <input className="form-input rounded-lg border-slate-200  bg-white/50  focus:border-primary focus:ring-primary outline-none transition-all p-3 text-slate-900 " type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900  mb-6">Travel Interests</h2>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Travel Styles</h4>
                    <div className="flex flex-wrap gap-3">
                      {TRAVEL_STYLES.map(style => {
                        const isSelected = selectedStyles.includes(style.id);
                        return (
                          <button key={style.id} onClick={() => toggleStyle(style.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${isSelected ? 'bg-primary text-white hover:brightness-110' : 'bg-slate-100  text-slate-600  border border-transparent hover:border-primary/30'}`}>
                            <span className="material-symbols-outlined text-sm">{style.icon}</span> {style.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Preferred Seasons</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {SEASONS.map(season => {
                        const isSelected = selectedSeasons.includes(season.id);
                        return (
                          <div key={season.id} onClick={() => toggleSeason(season.id)}
                            className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-100  bg-white/30  hover:border-primary/20'}`}>
                            <span className={`material-symbols-outlined mb-2 ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{season.icon}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-600 '}`}>{season.label}</span>
                            {isSelected && <div className="absolute top-2 right-2 h-4 w-4 bg-primary rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-white font-bold block">check</span></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-4">
                <button className="px-6 py-3 rounded-lg text-slate-600  font-semibold hover:bg-slate-100 :bg-slate-800 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={isSaving}
                  className="px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-70 flex items-center gap-2">
                  {isSaving ? <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
            <div className="bg-green-500 rounded-full p-1 flex items-center justify-center"><span className="material-symbols-outlined text-white text-[16px]">check</span></div>
            <p className="text-sm font-medium">{toastMessage}</p>
            <button onClick={() => setToastMessage('')} className="ml-4 text-slate-400 hover:text-white cursor-pointer transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
