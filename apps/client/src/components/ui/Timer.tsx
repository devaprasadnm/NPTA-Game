// ============================================
// Timer Component — Circular countdown
// ============================================

import { motion } from 'framer-motion';
import { formatTime } from '@npta/shared';

interface TimerProps {
  remaining: number;
  total: number;
  size?: number;
}

export function Timer({ remaining, total, size = 120 }: TimerProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;
  const offset = circumference * (1 - progress);
  const isUrgent = remaining <= 10;
  const isCritical = remaining <= 5;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-slate-200 dark:text-slate-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={
            isCritical
              ? 'text-rose-500'
              : isUrgent
                ? 'text-amber-500'
                : 'text-primary-500'
          }
          stroke="currentColor"
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>

      {/* Time text */}
      <motion.div
        className={`
          text-center font-display font-bold
          ${isCritical ? 'text-rose-500 timer-pulse' : isUrgent ? 'text-amber-500' : 'text-slate-800 dark:text-white'}
        `}
        style={{ fontSize: size * 0.25 }}
        key={remaining}
        initial={{ scale: isUrgent ? 1.2 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {formatTime(remaining)}
      </motion.div>
    </div>
  );
}
