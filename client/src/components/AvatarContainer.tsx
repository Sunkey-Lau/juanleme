interface AvatarContainerProps {
  avatarId?: string;
  frameId?: string;
  sizeClass?: string;
  emojiSizeClass?: string;
}

const avatarEmojis: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', bear: '🐻', panda: '🐼',
  lion: '🦁', fox: '🦊', frog: '🐸', unicorn: '🦄', ghost: '👻',
  alien: '👽', robot: '🤖', default: '🥬',
};

// 头像框样式定义
const frameStyles: Record<string, { border: string; shadow: string; bg: string }> = {
  none:     { border: '', shadow: '', bg: '' },
  fire:     { border: 'border-2 border-orange-400', shadow: 'shadow-[0_0_8px_2px_rgba(251,146,60,0.5)]', bg: 'bg-gradient-to-br from-orange-200 to-red-300' },
  star:     { border: 'border-2 border-yellow-400', shadow: 'shadow-[0_0_8px_2px_rgba(250,204,21,0.5)]', bg: 'bg-gradient-to-br from-yellow-200 to-amber-300' },
  crown:    { border: 'border-3 border-amber-500', shadow: 'shadow-[0_0_10px_3px_rgba(245,158,11,0.5)]', bg: 'bg-gradient-to-br from-amber-200 to-yellow-400' },
  rainbow:  { border: 'border-2', shadow: 'shadow-[0_0_8px_2px_rgba(168,85,247,0.4)]', bg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-cyan-200' },
  diamond:  { border: 'border-2 border-cyan-300', shadow: 'shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]', bg: 'bg-gradient-to-br from-cyan-200 to-blue-300' },
  heart:    { border: 'border-2 border-pink-400', shadow: 'shadow-[0_0_8px_2px_rgba(244,114,182,0.5)]', bg: 'bg-gradient-to-br from-pink-200 to-rose-300' },
};

export function AvatarContainer({
  avatarId = 'default',
  frameId = 'none',
  sizeClass = 'w-12 h-12',
  emojiSizeClass = 'text-2xl',
}: AvatarContainerProps) {
  const avatarEmoji = avatarEmojis[avatarId] || avatarEmojis.default;
  const frame = frameStyles[frameId] || frameStyles.none;

  return (
    <div className={`relative ${sizeClass} flex-shrink-0 select-none`}>
      {/* Frame border */}
      <div className={`absolute inset-0 rounded-full ${frame.bg} ${frame.border} ${frame.shadow} flex items-center justify-center`}>
        {/* Avatar emoji */}
        <span className={`${emojiSizeClass} leading-none select-none drop-shadow-sm`}>
          {avatarEmoji}
        </span>
      </div>
    </div>
  );
}
