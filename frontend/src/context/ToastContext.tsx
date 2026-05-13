'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {isMounted && createPortal(
        <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border
                flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300
                ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                  toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                  toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  'bg-white border-slate-200 text-slate-800'}
              `}
            >
              <div className={`
                size-10 rounded-xl flex items-center justify-center shrink-0
                ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 
                  toast.type === 'error' ? 'bg-rose-500 text-white' :
                  toast.type === 'warning' ? 'bg-amber-500 text-white' :
                  'bg-primary text-white'}
              `}>
                <span className="material-symbols-outlined text-xl">
                  {toast.type === 'success' ? 'check_circle' : 
                   toast.type === 'error' ? 'error' :
                   toast.type === 'warning' ? 'warning' : 'info'}
                </span>
              </div>
              <div className="flex-1 text-sm font-bold leading-tight">
                {messageTranslation(toast.message)}
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="size-8 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center text-current/50"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Simple utility to translate common technical error messages if needed, or just return as is
const messageTranslation = (msg: string) => {
  if (msg.includes('Failed to fetch')) return 'Kết nối máy chủ thất bại. Vui lòng kiểm tra internet.';
  if (msg.includes('Unauthorized')) return 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
  return msg;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
