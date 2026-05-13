'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Token không hợp lệ hoặc đã hết hạn.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'warning');
      return;
    }
    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      if (response.data.success) {
        showToast('Mật khẩu đã được đặt lại thành công!', 'success');
        router.push('/login');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md mx-auto">
        <div className="size-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Đường dẫn này không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu một mã mới.
        </p>
        <Link href="/forgot-password" className="w-full inline-block bg-primary text-white font-bold py-3.5 rounded-xl transition-all hover:bg-primary/90">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">lock</span>
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">lock_clock</span>
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
              placeholder="Repeat password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isLoading ? 'Updating...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Set new password</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Must be at least 6 characters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
