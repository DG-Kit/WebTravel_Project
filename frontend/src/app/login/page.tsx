'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        router.push('/profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ÄÄƒng nháº­p tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* === Stitch Design: Login Page (no global header, full split screen) === */
    <div className="bg-background-light  text-slate-900  antialiased min-h-screen">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left hero panel */}
        <div
          className="relative hidden w-1/2 lg:flex flex-col justify-between p-12 bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA6-Ttxc-laouQj9nQ2gEn5HzSxTpdj9RozOkyWDMzc-zM6ZGkHOVbBJuSzE4JN94LXcr6VAJ-WcsgoDe56u-Hvuh9Btxd4NC3suZBV8yjU2fi0a02sqUh2qSyHJD5b3eg7maCTtfLjDQfGOXps2_ZG9GD_RIp1hjrm6tPQL_a3b1zz8tqi66sT6w0A8y9pl-kBhKihzNpUdB-JbhHyWJLaQVqIa-QTxvOZFI8g2_3-256ZvudcJXjQQ-CNezSQ8mfj2pw0mEOiGCM')" }}
        >
          <div className="absolute inset-0 bg-primary/20 backdrop-brightness-75"></div>
          <div className="relative z-10 flex items-center gap-3 text-white">
            <div className="size-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">WebTravel</h2>
          </div>
          <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">Your journey <br/>starts with a single click.</h1>
            <p className="text-white/90 text-lg font-medium">Access exclusive travel deals and personalized itineraries curated just for you.</p>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              <img alt="" className="size-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXCryQHOmitmsP8XyPn0Bxj-0kI3IJj_BM8wp4CTGQKTzSy8pr3sRzauZLCtDWoG1MrPs3emxBJNbr-W6_1LSIhEjfmPmjmAX_b7lvfKhCPFooit5xVxLdPJeNRD567uuiE_9sXd2YZZIdwl_XaoIOQTCJGHwItH5KN4lm4g9v7laggcPDOOUyemZPJAH-yXp6DV985JUjOpTeYRpPE4YsLCyC7Fc9nGnc7D3lkePfIopjb38d2W07O41CRgLKqKbC6d1NJ7HmfmY" />
              <img alt="" className="size-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6GA3xjbKvZrfcX18nOm7M9N6AOvlXZ980c1azoq9bC1uglVHoM50G79z820ZmU9VLPBo8ngkWykxRQeVENHdWNgfpP9v0M3eyTtQV23teLd9kgakwg7sFdl6yNw27LB8hdd1xfqQReiMALa4Xbn1OiGpdkhr1IGooLmFnM5yxQPKqBVS4xnc5eXJXdKNExWE2Fu_x0zQPEqyR3hQ7vRMejvLOSjNLgfALFsP7xE5K2_FqyIMXlEivmHqKKs6AXbfbsl3gZIeKyRc" />
              <img alt="" className="size-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvQGw-L50osYoyTNm76uIqJT0qkiKqE4-3yKvTGoFE-PT695ngcEqDcaU8fglQSMPw2Amd-EaBVkSVroeJORAOI2p7kVhemWJslu8Xpx3tP4RGykRy3kAFP3yIIJB4i1hQV6hij4MXC99-bQpTC22prIFF3qS1GB2FT_6QchGD7M_rZmgebKgC9Am5iLkhl0zoaktmkfq4c0m6AIbYH4Y0t-nx-2Y2jwCT0aTgsCCwsNJ10TqseaDDJLk44pd-AhPARxIOe0NVosw" />
            </div>
            <p className="text-white text-sm font-semibold">Join 10k+ travelers this month</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-24 bg-background-light ">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-12 flex items-center gap-2">
              <span className="text-primary material-symbols-outlined text-4xl">flight_takeoff</span>
              <h2 className="text-slate-900  text-2xl font-bold">WebTravel</h2>
            </div>
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 ">Welcome Back</h2>
              <p className="mt-2 text-slate-500 ">Please enter your details to sign in.</p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div className="p-3 rounded-lg bg-red-50  border border-red-200  text-red-600  text-sm font-medium">{error}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700  mb-2" htmlFor="email">Email Address</label>
                <input className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary   text-slate-900  placeholder:text-slate-400 outline-none transition-all" id="email" placeholder="name@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700  mb-2" htmlFor="password">Password</label>
                <div className="relative">
                  <input className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary   text-slate-900  placeholder:text-slate-400 outline-none transition-all" id="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                  <button className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-primary transition-colors cursor-pointer" type="button" onClick={() => setShowPassword(!showPassword)}>
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary  " id="remember-me" name="remember-me" type="checkbox" />
                  <label className="ml-2 block text-sm font-medium text-slate-600 " htmlFor="remember-me">Remember me</label>
                </div>
                <a className="text-sm font-bold text-primary hover:text-primary/80 transition-colors" href="#">Forgot password?</a>
              </div>
              <button className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 "></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-background-light  text-slate-500">Or continue with</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200  bg-white  px-4 py-3 text-sm font-semibold text-slate-700  hover:bg-slate-50 :bg-slate-800 transition-colors" type="button">
                  <img alt="" className="size-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzhW1cBn7AwujWJtlL5a3NwRJEfzwwq8fQiRMxMEeJ25yW5GtN46pBTSTp5hq0CWdygzk7RF_5j1rYWHTbnatcSeqT0oDgh-OgLkt5cq8eCifeOx9t5geNRJdeyNOU8uw5i-bH_7yoRU4SgQIKmLMmtdh57TZBUWMBD3TD1DlwirCvac_4PQbvLd3AAjiezGEZM9vJjc8eTg4qVYN2VAmtfCYHUAwmEmqwLoeDszc3hQ22-_7fGd41kiZHjZVDnxf2NvvsvLmb1mQ" />
                  Google
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200  bg-white  px-4 py-3 text-sm font-semibold text-slate-700  hover:bg-slate-50 :bg-slate-800 transition-colors" type="button">
                  <img alt="" className="size-5 " src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDSHHS3VMsQaexGkEembhef76XKEGDihD2BWGNF4j0mkX9VM7cXufzuCe82UXNNicn9oBw4Trr2siOXQGPV3mCqd4yN5-z4dXNa6n5og8DF2AqmWY7cbHGYNxiODoSHzBM8tsxggjP8VEAWB4y2N8fM7TVgzLkkrVbgHXPgXav0yKaLFciEfKyldPvzM6AtuX_t__iimT5cniNHAJj_JDclQ56CWc8eMWljJ-ti00YD-tlvQOPmZFSlQoGgpbEmzxNclID3bKnB4U" />
                  Apple
                </button>
              </div>
            </form>
            <p className="mt-10 text-center text-sm text-slate-500 ">
              Don't have an account? <a className="font-bold text-primary hover:text-primary/80 transition-colors" href="/register">Sign up for free</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
