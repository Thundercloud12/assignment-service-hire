import React from 'react';
import { useNotificationStore, type IToast } from '../store/notification.store';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  const getStyleClasses = (type: IToast['type']) => {
    switch (type) {
      case 'success':
        return 'border-accent-emerald bg-[#0d1f14] text-accent-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'error':
        return 'border-accent-rose bg-[#221013] text-accent-rose shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      case 'warning':
      case 'info':
      default:
        return 'border-primary bg-[#22220f] text-primary shadow-[0_0_15px_rgba(250,255,105,0.15)]';
    }
  };

  const getIcon = (type: IToast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
      case 'info':
      default:
        return (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 p-4 border rounded-lg pointer-events-auto animate-slide-in font-mono text-xs ${getStyleClasses(
            toast.type
          )}`}
        >
          <div className="flex gap-2.5 items-start">
            {getIcon(toast.type)}
            <span className="font-bold leading-relaxed">{toast.message}</span>
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-white p-0.5 rounded transition active:scale-[0.85] cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
