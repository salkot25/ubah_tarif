import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Input component
 */
export const Input = forwardRef(function Input({
  label,
  hint,
  error,
  required,
  className = '',
  leftIcon: LeftIcon,
  rightElement,
  ...props
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <LeftIcon size={16} className="text-slate-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${error ? 'form-input-error' : 'form-input'}
            ${LeftIcon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && (
        <p className="form-error">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Textarea component
 */
export const Textarea = forwardRef(function Textarea({
  label,
  hint,
  error,
  required,
  rows = 3,
  className = '',
  ...props
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`form-textarea ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && (
        <p className="form-error">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
});
