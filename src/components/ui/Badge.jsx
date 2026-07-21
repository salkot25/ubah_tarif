import React from 'react';

/**
 * Badge component
 * variant: 'primary' | 'success' | 'danger' | 'warning' | 'neutral'
 */
export function Badge({ children, variant = 'neutral', className = '', dot = false }) {
  const variantClass = {
    primary: 'badge-primary',
    success: 'badge-success',
    danger:  'badge-danger',
    warning: 'badge-warning',
    neutral: 'badge-neutral',
  }[variant] || 'badge-neutral';

  const dotColor = {
    primary: 'bg-blue-500',
    success: 'bg-emerald-500',
    danger:  'bg-red-500',
    warning: 'bg-amber-500',
    neutral: 'bg-slate-400',
  }[variant] || 'bg-slate-400';

  return (
    <span className={`${variantClass} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}

/**
 * Helper to get Kesimpulan SPI badge variant
 */
export function KesimpulanBadge({ value }) {
  if (!value) return <Badge variant="neutral">—</Badge>;
  const variant = value === 'Efektif' ? 'success' : 'danger';
  return <Badge variant={variant} dot>{value}</Badge>;
}
