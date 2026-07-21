import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');

  return {
    success: (message, duration) => ctx.addToast({ message, type: 'success', duration }),
    error:   (message, duration) => ctx.addToast({ message, type: 'error', duration }),
    warning: (message, duration) => ctx.addToast({ message, type: 'warning', duration }),
    info:    (message, duration) => ctx.addToast({ message, type: 'info', duration }),
    remove:  ctx.removeToast,
  };
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-600', text: 'text-white' },
    error:   { icon: XCircle,      bg: 'bg-red-600',  text: 'text-white' },
    warning: { icon: AlertTriangle,bg: 'bg-amber-500', text: 'text-white' },
    info:    { icon: Info,         bg: 'bg-blue-700', text: 'text-white' },
  }[toast.type] || { icon: Info, bg: 'bg-slate-700', text: 'text-white' };

  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.text} rounded-xl shadow-card-lg px-4 py-3 flex items-start gap-3 animate-slide-up`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}
