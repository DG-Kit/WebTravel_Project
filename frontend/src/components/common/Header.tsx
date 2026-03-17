'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/70  backdrop-blur-md border-b border-slate-200/50  px-6 lg:px-12 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary group">
          <span className="material-symbols-outlined text-3xl font-bold group-hover:scale-110 transition-transform">explore</span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 ">WebTravel</h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-slate-600  hover:text-primary transition-colors text-sm font-semibold">
            Explore
          </Link>
          <Link href="/bookings" className="text-slate-600  hover:text-primary transition-colors text-sm font-semibold">
            Bookings
          </Link>
          {user && (
            <Link href="/profile" className="text-slate-600  hover:text-primary transition-colors text-sm font-semibold">
              Profile
            </Link>
          )}
          {user?.role === 'HOST' || user?.role === 'ADMIN' ? (
             <Link href="/host/dashboard" className="text-slate-600  hover:text-primary transition-colors text-sm font-semibold">
                Dashboard
             </Link>
          ) : null}
        </nav>

        {/* User Actions */}
        <div className="flex flex-1 justify-end gap-6 items-center">
          <div className="hidden sm:flex relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input className="w-full bg-slate-100  border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" placeholder="Search destinations..."/>
          </div>

          <div className="flex gap-3 items-center">
             {user ? (
               <div className="relative">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-white  overflow-hidden shadow-sm flex items-center justify-center">
                       {/* Placeholder Avatar */}
                       <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                  </button>
                  
                  {isDropdownOpen && (
                     <div className="absolute right-0 mt-2 w-48 bg-white  rounded-xl shadow-lg border border-slate-100  py-2 z-50">
                        <div className="px-4 py-3 border-b border-slate-100 ">
                           <p className="text-sm font-bold text-slate-900  truncate">{user.full_name}</p>
                           <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                         <Link onClick={() => setIsDropdownOpen(false)} href="/profile" className="px-4 py-2 text-sm text-slate-700  hover:bg-slate-50 :bg-slate-700/50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">account_circle</span>
                            Profile
                         </Link>
                         {user.role === 'HOST' || user.role === 'ADMIN' ? (
                           <Link onClick={() => setIsDropdownOpen(false)} href="/host/dashboard" className="px-4 py-2 text-sm text-slate-700  hover:bg-slate-50 :bg-slate-700/50 flex items-center gap-2">
                               <span className="material-symbols-outlined text-[18px]">domain</span>
                               Manage Properties
                           </Link>
                         ) : null}
                         <hr className="my-1 border-slate-100 "/>
                         <button 
                            onClick={() => {
                               setIsDropdownOpen(false);
                               logout();
                            }} 
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 :bg-slate-700/50 flex items-center gap-2"
                         >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Log Out
                         </button>
                      </div>
                  )}
               </div>
             ) : (
                <>
                   <Link href="/register" className="hidden sm:block bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20">Sign Up</Link>
                   <Link href="/login" className="bg-white  text-slate-900  px-5 py-2 rounded-xl text-sm font-bold border border-slate-200  hover:bg-slate-50 :bg-slate-700 transition-colors">Log In</Link>
                </>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}
