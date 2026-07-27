// ============================================
// RoomCode — Copyable room code display
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface RoomCodeProps {
  code: string;
}

export function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-6 py-3 rounded-2xl
                 bg-slate-100 dark:bg-surface-dark-2
                 border-2 border-dashed border-slate-300 dark:border-slate-600
                 hover:border-primary-400 dark:hover:border-primary-500
                 transition-colors group cursor-pointer"
      aria-label="Copy room code"
    >
      <span className="font-display font-bold text-2xl tracking-[0.3em] text-slate-800 dark:text-white">
        {code}
      </span>

      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-5 h-5 text-emerald-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
