import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button component
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
 * size: 'sm' | 'md' | 'lg'
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  const variantClass = {
    primary:          'btn-primary',
    secondary:        'btn-secondary',
    danger:           'btn-danger',
    ghost:            'btn-ghost',
    success:          'btn-success',
    outline:          'btn-outline',
    'outline-danger': 'btn-outline-danger',
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size] || 'btn-md';

  return (
    <button
      className={`${sizeClass} ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={16} />}
    </button>
  );
}
