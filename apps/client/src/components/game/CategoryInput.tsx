// ============================================
// CategoryInput — Single category answer field
// ============================================

import { motion } from 'framer-motion';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_PLACEHOLDERS, type Category } from '@npta/shared';

interface CategoryInputProps {
  category: Category;
  letter: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  index: number;
}

export function CategoryInput({
  category,
  letter,
  value,
  onChange,
  disabled = false,
  index,
}: CategoryInputProps) {
  const label = CATEGORY_LABELS[category];
  const icon = CATEGORY_ICONS[category];
  const placeholder = CATEGORY_PLACEHOLDERS[category];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="group"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        <span className="text-lg">{icon}</span>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-display font-bold text-primary-500 no-select">
          {letter}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={100}
          autoCapitalize="words"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`
            w-full pl-10 pr-4 py-3.5 rounded-2xl
            bg-white dark:bg-surface-dark-2
            border-2 border-slate-200 dark:border-slate-700
            text-slate-900 dark:text-white text-base
            placeholder:text-slate-300 dark:placeholder:text-slate-600
            transition-all duration-200
            focus:border-primary-500 dark:focus:border-primary-400
            focus:shadow-lg focus:shadow-primary-500/10
            disabled:opacity-50 disabled:cursor-not-allowed
            group-hover:border-slate-300 dark:group-hover:border-slate-600
          `}
        />
      </div>
    </motion.div>
  );
}
