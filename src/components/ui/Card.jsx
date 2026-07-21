import React from 'react';

/**
 * Card component
 */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`${hover ? 'card-hover' : 'card'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700/60 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 ${className}`}>
      {children}
    </div>
  );
}
