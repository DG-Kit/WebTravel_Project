'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

function BookingsContent() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // If no success flag and not explicitly viewing bookings, redirect to profile
    if (!isSuccess && !user) {
      router.push('/login');
    }
  }, [isSuccess, user, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-display">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 text-center">
        {isSuccess ? (
          <>
            <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <span className="material-symbols-outlined text-6xl">check_circle</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{t('success.paymentTitle')}</h1>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              {t('success.paymentSubtitle')}
            </p>
            <div className="space-y-4">
              <Link href="/profile" className="block w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]">
                {t('success.viewMyBookings')}
              </Link>
              <Link href="/explore" className="block w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition-all hover:bg-slate-200 active:scale-[0.98]">
                {t('success.continueExploring')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">hotel</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">{t('success.myBookingsTitle')}</h1>
            <p className="text-slate-500 mb-8">
              {t('success.myBookingsSubtitle')}
            </p>
            <Link href="/profile" className="block w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
              {t('success.goToProfile')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
