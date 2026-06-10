interface AvatarContainerProps {
  avatarId?: string;
  frameId?: string;
  sizeClass?: string;
  emojiSizeClass?: string;
}

const avatarEmojis: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
  bear: '🐻',
  panda: '🐼',
  lion: '🦁',
  fox: '🦊',
  frog: '🐸',
  unicorn: '🦄',
  ghost: '👻',
  alien: '👽',
  robot: '🤖',
  default: '🥬',
};

const frameEmojis: Record<string, string> = {
  none: '',
  fire: '🔥',
  star: '⭐',
  crown: '👑',
  rainbow: '🌈',
  diamond: '💎',
  heart: '❤️',
};

export function AvatarContainer({
  avatarId = 'default',
  frameId = 'none',
  sizeClass = 'w-12 h-12',
  emojiSizeClass = 'text-2xl',
}: AvatarContainerProps) {
  const avatarEmoji = avatarEmojis[avatarId] || avatarEmojis.default;
  const frameEmoji = frameEmojis[frameId] || '';

  return (
    <div className={`relative ${sizeClass} flex-shrink-0 select-none`}>
      {/* Frame background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center shadow-inner">
        <span className="text-base opacity-30">{frameEmoji}</span>
      </div>
      {/* Avatar emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${emojiSizeClass} leading-none select-none drop-shadow-sm`}>
          {avatarEmoji}
        </span>
      </div>
    </div>
  );
}
