import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }[size] || 'w-6 h-6';
  return <Loader2 className={`${sizeClass} animate-spin text-blue-600 dark:text-blue-400 ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-64">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat data...</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">{title}</p>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
