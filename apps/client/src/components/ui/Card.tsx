// ============================================
// Card Component — Glassmorphism container
// ============================================

import type { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline';
  animate?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  glass: 'glass-light rounded-3xl',
  solid: 'bg-white dark:bg-surface-dark-2 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20',
  outline: 'border border-slate-200 dark:border-slate-700 rounded-3xl bg-transparent',
};

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'solid',
  animate = true,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  const Component = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }
    : {};

  return (
    <Component
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...animationProps}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  );
}
