'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import MyBookings from './MyBookings';
import MyFavorites from './MyFavorites';
import MyReviews from './MyReviews';
import MyItineraries from './MyItineraries';

const TRAVEL_STYLES = [
  { id: 'Adventure', icon: 'hiking', label: 'Adventure' },
  { id: 'Relaxing', icon: 'spa', label: 'Relaxing' },
  { id: 'Cultural', icon: 'museum', label: 'Cultural' },
  { id: 'Budget', icon: 'payments', label: 'Budget' },
  { id: 'Luxury', icon: 'diamond', label: 'Luxury' },
  { id: 'Nature', icon: 'park', label: 'Nature' },
  { id: 'Romantic', icon: 'favorite', label: 'Romantic' },
  { id: 'Family-friendly', icon: 'family_restroom', label: 'Family' },
  { id: 'Solo-friendly', icon: 'person', label: 'Solo' }
];

const SEASONS = [
  { id: 'Summer', icon: 'sunny', label: 'Summer' },
  { id: 'Winter', icon: 'ac_unit', label: 'Winter' },
  { id: 'Spring', icon: 'eco', label: 'Spring' },
  { id: 'Autumn', icon: 'eco', label: 'Autumn' }
];

const BUDGET_LEVELS = [
  { id: 1, key: 'budgetLow', desc: { en: 'Low cost & Savings', vi: 'Giá rẻ & Tiết kiệm' }, icon: 'savings' },
  { id: 2, key: 'budgetMid', desc: { en: 'Balance & Standard', vi: 'Cân bằng & Phổ thông' }, icon: 'balance' },
  { id: 3, key: 'budgetHigh', desc: { en: 'Premium & Luxury', vi: 'Cao cấp & Sang trọng' }, icon: 'auto_awesome' }
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'favorites' | 'reviews' | 'itineraries'>('profile');
  const [counts, setCounts] = useState({ bookings: 0, favorites: 0, itineraries: 0 });

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
        setBudgetLevel(user.user_preferences.budget_level || 2);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const [bRes, fRes, iRes] = await Promise.all([
          api.get('/bookings/my-bookings'),
          api.get('/users/favorites'),
          api.get('/itineraries/my')
        ]);
        setCounts({
          bookings: bRes.data.data?.length || 0,
          favorites: fRes.data.data?.length || 0,
          itineraries: iRes.data.data?.length || 0
        });
      } catch (e) { console.error(e); }
    };
    fetchCounts();
  }, [user, activeTab]);

  const toggleStyle = (id: string) => setSelectedStyles(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSeason = (id: string) => setSelectedSeasons(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const handleSave = async () => {
    setError(''); setIsSaving(true);
    try {
      const payload = {
        full_name: fullName, phone,
        preferences: {
          travel_style: selectedStyles.join(','),
          preferred_categories: selectedSeasons.join(','),
          budget_level: budgetLevel
        }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light text-slate-900 min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
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
                <h3 className="text-xl font-bold text-slate-900">{user.full_name || 'Traveler'}</h3>
                <p className="text-slate-500 text-sm">{user.email}</p>
              </div>
              <div className="mt-6 w-full pt-6 border-t border-slate-100 flex justify-around">
                <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('common.bookings')}</p><p className="text-lg font-bold text-primary">{counts.bookings}</p></div>
                <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('profile.myItineraries') || 'Saved'}</p><p className="text-lg font-bold text-primary">{counts.itineraries}</p></div>
                <div className="text-center"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</p><p className="text-lg font-bold text-primary capitalize">{user.role?.toLowerCase()}</p></div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm">verified_user</span><span className="text-sm text-slate-600">Verified Explorer</span></div>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm">calendar_today</span><span className="text-sm text-slate-600">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}</span></div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
              {[
                { id: 'profile', label: t('profile.personalInfo') },
                { id: 'bookings', label: t('profile.myBookings') },
                { id: 'itineraries', label: 'My Itineraries' },
                { id: 'favorites', label: t('profile.myFavorites') },
                { id: 'reviews', label: 'Reviews' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-6 font-bold text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-800'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <>
                {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">{error}</div>}
                <section className="glass-card rounded-xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">{t('profile.personalInfo')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">{t('auth.fullName')}</label>
                      <input className="form-input rounded-lg border border-slate-200 bg-white/50 focus:border-primary focus:ring-primary outline-none transition-all p-3 text-slate-900" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">{t('auth.email')} (Read only)</label>
                      <input className="form-input rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none p-3" type="email" value={email} readOnly />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700">{t('auth.phone')}</label>
                      <input className="form-input rounded-lg border border-slate-200 bg-white/50 focus:border-primary focus:ring-primary outline-none transition-all p-3 text-slate-900" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                </section>

                <section className="glass-card rounded-xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">{t('profile.preferences')}</h2>
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">{t('profile.travelStyle')}</h4>
                      <div className="flex flex-wrap gap-3">
                        {TRAVEL_STYLES.map(style => {
                          const isSelected = selectedStyles.includes(style.id);
                          return (
                            <button key={style.id} onClick={() => toggleStyle(style.id)}
                              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 border border-transparent hover:border-primary/30'}`}>
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
                              className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white/30 hover:border-primary/20'}`}>
                              <span className={`material-symbols-outlined mb-2 ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{season.icon}</span>
                              <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>{season.label}</span>
                              {isSelected && <div className="absolute top-2 right-2 h-4 w-4 bg-primary rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-white font-bold block">check</span></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">{t('profile.budget')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {BUDGET_LEVELS.map(level => {
                          const isSelected = budgetLevel === level.id;
                          return (
                            <div key={level.id} onClick={() => setBudgetLevel(level.id)}
                              className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white/30 hover:border-primary/20'}`}>
                              <span className={`material-symbols-outlined mb-2 ${isSelected ? 'text-primary' : 'text-slate-400'}`}>{level.icon}</span>
                              <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>{t(`profile.${level.key}`)}</span>
                              <span className="text-[10px] text-slate-400 text-center mt-1">{(level.desc as any)[language]}</span>
                              {isSelected && <div className="absolute top-2 right-2 h-4 w-4 bg-primary rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-white font-bold block">check</span></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-end gap-4">
                  <button onClick={handleSave} disabled={isSaving}
                    className="px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center gap-2">
                    {isSaving ? <><span className="material-symbols-outlined animate-spin text-sm">sync</span> {t('profile.saving')}</> : t('profile.saveChanges')}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'bookings' && <MyBookings />}
            {activeTab === 'itineraries' && <MyItineraries />}
            {activeTab === 'favorites' && <MyFavorites />}
            {activeTab === 'reviews' && <MyReviews />}
          </div>
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
            <div className="bg-green-500 rounded-full p-1 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">check</span>
            </div>
            <p className="text-sm font-medium">{toastMessage}</p>
            <button onClick={() => setToastMessage('')} className="ml-4 text-slate-400 hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
