// ============================================
// Confetti — Celebration animation
// ============================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
const CONFETTI_COUNT = 60;

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  shape: 'square' | 'circle';
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -(Math.random() * 20 + 10),
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 2,
    shape: Math.random() > 0.5 ? 'square' : 'circle',
  }));
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    setPieces(generateConfetti());
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={piece.shape === 'circle' ? 'rounded-full' : ''}
          style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [piece.rotation, piece.rotation + 720],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
