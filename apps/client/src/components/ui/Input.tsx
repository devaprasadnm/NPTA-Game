// ============================================
// Input Component — Styled with label & error
// ============================================

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-2xl
              bg-white dark:bg-surface-dark-2
              border border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              transition-all duration-200
              focus:border-primary-500 dark:focus:border-primary-400
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-rose-500 dark:border-rose-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-rose-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
