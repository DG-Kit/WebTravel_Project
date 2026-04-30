'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user) {
       const role = user.role.toUpperCase();
       if (role !== 'HOST' && role !== 'ADMIN') {
         router.push('/');
       }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/host/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/host/hotels', label: 'My Hotels', icon: 'hotel' },
    { href: '/host/bookings', label: 'Bookings', icon: 'calendar_month' },
    { href: '/host/earnings', label: 'Earnings', icon: 'payments' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-display flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 sticky top-0 h-screen flex flex-col p-6">
        <div className="flex items-center gap-3 text-primary mb-10">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">domain</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Host Hub</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-2">
          <Link href="/explore" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back to Site</span>
          </Link>
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium text-left">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {navItems.find(i => i.href === pathname)?.label || 'Host Dashboard'}
            </h2>
            <p className="text-xs text-slate-400">Welcome back, {user.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-bold">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user.role}</p>
             </div>
             <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
               {user.full_name?.charAt(0)}
             </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
