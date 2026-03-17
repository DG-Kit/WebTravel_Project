'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Máº­t kháº©u nháº­p láº¡i khÃ´ng khá»›p.'); return; }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { full_name: fullName, email, password });
      if (response.data.success) { sessionStorage.setItem('registerSuccess', 'true'); router.push('/login'); }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ÄÄƒng kÃ½ tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i sau.');
    } finally { setIsLoading(false); }
  };

  return (
    /* === Stitch Design: Sign Up Page (no global header, full split screen) === */
    <div className="bg-background-light  min-h-screen flex items-center justify-center font-display">
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left hero panel */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChILPH1RrURXy6Y3wUYDho6lCmlyvGbYDmth-LZD9TgwH2AOaIV_MNkzU3-SCvO7bB-byR7qUGmKoSAeoo_s8BOZKJ_7nttOXhNkSEQaRDn3M7B9uKaNrSvCmXrrxlluD6nBJz1hNwZEeSg4qpORwB8tTSyjjAkFN--paKchspfE8mj2g-kCKQYJ39e7cHh7MAXtYN4qNahug3KU40po5xlJu4jJ3piB8Q8VmXtvHUnvpZ9FYFHpW5jttnaSupA6pJ2MxVXgGe0J8')" }}>
            <div className="absolute inset-0 bg-linear-to-t from-primary/60 to-transparent"></div>
          </div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-4xl">travel_explore</span>
              <span className="text-2xl font-bold tracking-tight">WebTravel</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">Discover the world's most hidden gems.</h1>
            <p className="text-lg text-slate-100 max-w-md">Join over 2 million travelers exploring 150+ countries with personalized itineraries and local insights.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background-light  relative overflow-y-auto">
          <div className="absolute top-8 right-8 lg:hidden">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">travel_explore</span>
              <span className="text-xl font-bold tracking-tight">WebTravel</span>
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="glass p-8 rounded-xl shadow-2xl border border-primary/10">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900  mb-2">Create Account</h2>
                <p className="text-slate-500 ">Start your journey with us today.</p>
              </div>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && <div className="p-3 rounded-lg bg-red-50  border border-red-200  text-red-600  text-sm font-medium">{error}</div>}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700  ml-1">Full Name</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                    <input className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900   " placeholder="John Doe" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700  ml-1">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                    <input className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900   " placeholder="john@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700  ml-1">Password</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                      <input className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700  ml-1">Confirm</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock_reset</span>
                      <input className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900" placeholder="••••••••" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/30" id="terms" type="checkbox" required />
                  <label className="text-xs text-slate-600 " htmlFor="terms">I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a></label>
                </div>
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={isLoading}>
                  <span>{isLoading ? 'Creating...' : 'Create Account'}</span>
                  {!isLoading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>
              </form>
              <div className="mt-8 text-center">
                <p className="text-slate-600  text-sm">Already have an account? <a className="text-primary font-bold hover:underline ml-1" href="/login">Sign in</a></p>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200/50 flex flex-col gap-4">
                <button className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium   :bg-slate-800">
                  <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDALBwxXokK5UZw2CLE4jEL65HIB7S3pZHZB5FwCL3i-yf_LMK9NN_OG1jrE_S-FGqzIv_HPrwGx-pLzW3r5gl45pBiw-ZVXjHa11_mOpQ_c69OBdAv5HjN4tXplvvn6DSH3fVoQ0Fcvk1PGCf6vF_Ac7IvkBAU3s2-WWDugcrbRWEkrJKviLjAqNJhtPC95QSrwVBJf0RIh9Hb57lYvFU5Hn3z1mluSaFaSeXdfz1arBwIW33tCbbl-QzHgPxBXzjRL7DyqvVlP2g" />
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
