'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Mã xác thực không hợp lệ.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Xác thực tài khoản thành công!');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác thực thất bại. Token có thể đã hết hạn.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full text-center">
      {status === 'loading' && (
        <div className="py-8">
          <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-slate-900">Đang xác thực...</h3>
          <p className="text-slate-500 mt-2">Vui lòng chờ trong giây lát.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-4">
          <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl">verified_user</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Tuyệt vời!</h3>
          <p className="text-slate-600 mb-8">{message}</p>
          <Link href="/login" className="inline-block w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="py-4">
          <div className="size-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl">error</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Lỗi xác thực</h3>
          <p className="text-slate-600 mb-8">{message}</p>
          <Link href="/register" className="inline-block w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-xl transition-all hover:bg-slate-200">
            Quay lại trang đăng ký
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-display">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
