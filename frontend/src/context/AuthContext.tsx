'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

export interface UserPreferences {
  preference_id?: number;
  preferred_categories?: string | null;
  travel_style?: string | null;
  budget_level?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  user_id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  user_preferences?: UserPreferences | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await api.get('/users/me');
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            console.warn('Xác thực thất bại:', response.data.message);
            handleLogout(false); // clear auth but do not redirect
          }
        } catch (error: any) {
          // Chỉ log lỗi ra console nếu không phải lỗi 401 (Hết hạn token)
          if (error.response?.status !== 401) {
            console.error('Lỗi xác thực token:', error);
          }
          handleLogout(false); // clear auth but do not redirect
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = async (redirect = true) => {
    // Call backend to invalidate token in DB
    try {
      await api.post('/auth/logout');
    } catch {
      // Silent fail — always clear local state regardless
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    if (redirect) {
      router.push('/login');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout: handleLogout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
