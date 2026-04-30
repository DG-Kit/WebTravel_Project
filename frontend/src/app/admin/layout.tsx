'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && user.role.toUpperCase() !== 'ADMIN') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
    { href: '/admin/hotels', label: 'All Hotels', icon: 'hotel' },
    { href: '/admin/destinations', label: 'Destinations', icon: 'location_on' },
    { href: '/admin/settings', label: 'Site Settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-display flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 sticky top-0 h-screen flex flex-col p-6">
        <div className="flex items-center gap-3 text-rose-500 mb-10">
          <div className="size-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Admin Panel</span>
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
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-rose-500'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-2">
          <Link href="/explore" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all font-medium">
            <span className="material-symbols-outlined text-slate-400">arrow_back</span>
            <span>Back to Site</span>
          </Link>
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-medium text-left">
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
              {navItems.find(i => i.href === pathname)?.label || 'System Administration'}
            </h2>
            <p className="text-xs text-slate-400">Global Management Console</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-bold">{user.full_name}</p>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Master Admin</p>
             </div>
             <div className="size-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
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
