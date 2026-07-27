// ============================================
// Button Component — Reusable with variants
// ============================================

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'gradient-bg text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 active:shadow-primary-500/20',
  secondary:
    'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-surface-dark-3 dark:text-white dark:hover:bg-slate-600',
  accent:
    'gradient-bg-accent text-white shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-surface-dark-2',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`
          inline-flex items-center justify-center gap-2
          font-semibold transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
