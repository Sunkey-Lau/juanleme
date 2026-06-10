interface CabbageAnimationProps {
  isEating: boolean;
  animationSkin?: string;
}

const skinEmoji: Record<string, string> = {
  cabbage: '🥬',
  cat: '🐱',
  seedling: '🌱',
  star: '⭐',
};

export function CabbageAnimation({ isEating, animationSkin = 'cabbage' }: CabbageAnimationProps) {
  const emoji = skinEmoji[animationSkin] || skinEmoji.cabbage;
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className={`text-8xl transition-all duration-500 ${isEating ? 'scale-110 animate-bounce' : 'scale-100'}`}>
        {emoji}
      </div>
      <div className="text-xs text-white/40 mt-2 font-medium">
        {isEating ? '正在努力卷...' : '准备开卷'}
      </div>
    </div>
  );
}
