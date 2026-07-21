import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Select dropdown component
 */
export const Select = forwardRef(function Select({
  label,
  hint,
  error,
  required,
  options = [],
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
      <div className="relative">
        <select
          ref={ref}
          className={`
            form-select appearance-none pr-10
            ${error ? 'border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-950/40' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
        </div>
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
