// ============================================
// Badge Component — Status indicators
// ============================================

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  accent: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
  accent: 'bg-teal-500',
};

export function Badge({ variant = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5 rounded-full
        text-xs font-semibold
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
}
