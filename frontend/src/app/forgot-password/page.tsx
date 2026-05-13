'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        setIsSent(true);
        showToast('Email đặt lại mật khẩu đã được gửi!', 'success');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Forgot password?</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          {!isSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email Sent!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam).
              </p>
              <button 
                onClick={() => setIsSent(false)}
                className="text-primary font-bold hover:underline text-sm"
              >
                Didn't receive email? Try again
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
