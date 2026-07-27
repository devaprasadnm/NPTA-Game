// ============================================
// LetterReveal — Animated letter display
// ============================================

import { motion, AnimatePresence } from 'framer-motion';

interface LetterRevealProps {
  letter: string;
  countdown?: number;
}

export function LetterReveal({ letter, countdown }: LetterRevealProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={letter}
          initial={{ scale: 0, rotateY: 180, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          exit={{ scale: 0, rotateY: -180, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl gradient-bg pulse-glow
                     flex items-center justify-center shadow-2xl"
        >
          <span className="text-6xl sm:text-7xl font-display font-black text-white no-select">
            {letter}
          </span>
        </motion.div>
      </AnimatePresence>

      {countdown !== undefined && countdown > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Round starts in
          </p>
          <motion.p
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-display font-bold gradient-text"
          >
            {countdown}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
