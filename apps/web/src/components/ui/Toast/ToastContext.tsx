import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import './Toast.scss';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalToastHandler: ToastContextType['toast'] | null = null;

export const toast = {
  success: (message: string, title?: string) => globalToastHandler?.success(message, title),
  error: (message: string, title?: string) => globalToastHandler?.error(message, title),
  warning: (message: string, title?: string) => globalToastHandler?.warning(message, title),
  info: (message: string, title?: string) => globalToastHandler?.info(message, title),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastMethods = {
    success: (message: string, title?: string) => addToast('success', message, title),
    error: (message: string, title?: string) => addToast('error', message, title),
    warning: (message: string, title?: string) => addToast('warning', message, title),
    info: (message: string, title?: string) => addToast('info', message, title),
  };

  globalToastHandler = toastMethods;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <IconCheck size={17} stroke={2.5} />;
      case 'error':
        return <IconAlertCircle size={17} stroke={2.2} />;
      case 'warning':
        return <IconAlertTriangle size={17} stroke={2.2} />;
      case 'info':
      default:
        return <IconInfoCircle size={17} stroke={2.2} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`} role="alert">
            <div className="toast-icon">{getIcon(t.type)}</div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Close"
            >
              <IconX size={14} stroke={2.2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
