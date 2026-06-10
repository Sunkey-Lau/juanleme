import type { ReactNode } from 'react';

interface StickerIconProps {
  type: 'coin' | 'settings' | 'friends' | 'bell' | 'leaderboard' | 'dressup' | 'gift' | 'play' | 'stop' | 'close';
  size?: number;
  className?: string;
}

const emojiMap: Record<string, string> = {
  coin: '🪙',
  settings: '⚙️',
  friends: '👥',
  bell: '🔔',
  leaderboard: '🏆',
  dressup: '✨',
  gift: '🎁',
  play: '▶️',
  stop: '⏹️',
  close: '❌',
};

export function StickerIcon({ type, size = 24, className = '' }: StickerIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {emojiMap[type] || '❓'}
    </span>
  );
}
