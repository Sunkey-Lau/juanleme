import { Palette, Type as TypeIcon, Sparkles } from "lucide-react";

export const themeSkins: Record<string, { name: string; bgClass: string; textColor: string }> = {
  default:  { name: "经典深紫", bgClass: "bg-gradient-to-br from-[#1e1338] to-[#2d1f4a]", textColor: "text-white" },
  ocean:    { name: "深海蓝",   bgClass: "bg-gradient-to-br from-[#0a1628] to-[#1a2d4a]", textColor: "text-white" },
  sakura:   { name: "樱花粉",   bgClass: "bg-gradient-to-br from-[#2a1428] to-[#3d1f33]", textColor: "text-white" },
  forest:   { name: "森林绿",   bgClass: "bg-gradient-to-br from-[#0a1a12] to-[#1a2d1f]", textColor: "text-white" },
  darkgold: { name: "暗夜黑金", bgClass: "bg-gradient-to-br from-[#0d0a0a] to-[#1f1a10]", textColor: "text-amber-100" },
  cyberpunk:{ name: "赛博朋克", bgClass: "bg-gradient-to-br from-[#0a0015] to-[#1a0040]", textColor: "text-cyan-200" },
};

export const digitSkins: Record<string, { name: string; class: string }> = {
  classic:  { name: "经典白",  class: "text-white" },
  neon:     { name: "霓虹蓝",  class: "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" },
  fire:     { name: "火焰红",  class: "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" },
  rainbow:  { name: "彩虹",    class: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 to-cyan-400" },
};

const animationSkins: Record<string, string> = {
  cabbage: '🥬',
  cat: '🐱',
  seedling: '🌱',
  star: '⭐',
};

interface DressUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSkin: string;
  onSkinChange: (skin: string) => void;
  timerDigitSkin: string;
  onTimerDigitSkinChange: (skin: string) => void;
  animationSkin?: string;
  onAnimationSkinChange?: (skin: string) => void;
  skinGradientClass?: string;
}

export function DressUpDialog({
  open, onOpenChange,
  currentSkin, onSkinChange,
  timerDigitSkin, onTimerDigitSkinChange,
  animationSkin, onAnimationSkinChange,
}: DressUpDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1428] rounded-3xl w-[320px] max-h-[500px] border border-white/20 overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> 装扮中心</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Theme skins */}
          <div>
            <div className="flex items-center gap-1.5 mb-2"><Palette className="w-3 h-3 text-white/60" /><h4 className="text-[10px] text-white/60 uppercase">主题皮肤</h4></div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(themeSkins).map(([key, s]) => (
                <button key={key} onClick={() => onSkinChange(key)}
                  className={`p-2 rounded-lg text-[10px] text-white/80 border transition-all cursor-pointer text-center ${currentSkin === key ? 'border-yellow-400/60 bg-yellow-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div className={`h-6 rounded mb-1 ${s.bgClass}`} />
                  <div className="truncate">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Digit skins */}
          <div>
            <div className="flex items-center gap-1.5 mb-2"><TypeIcon className="w-3 h-3 text-white/60" /><h4 className="text-[10px] text-white/60 uppercase">数字字体</h4></div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(digitSkins).map(([key, s]) => (
                <button key={key} onClick={() => onTimerDigitSkinChange(key)}
                  className={`p-2 rounded-lg text-xs border transition-all cursor-pointer text-center ${timerDigitSkin === key ? 'border-yellow-400/60 bg-yellow-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div className={`font-mono font-bold ${s.class}`}>88:88</div>
                  <div className="text-[9px] text-white/50">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Animation skins */}
          <div>
            <div className="flex items-center gap-1.5 mb-2"><Sparkles className="w-3 h-3 text-white/60" /><h4 className="text-[10px] text-white/60 uppercase">动画伙伴</h4></div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(animationSkins).map(([key, emoji]) => (
                <button key={key} onClick={() => onAnimationSkinChange?.(key)}
                  className={`p-2 rounded-lg text-xl border transition-all cursor-pointer text-center ${animationSkin === key ? 'border-yellow-400/60 bg-yellow-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <div>{emoji}</div>
                  <div className="text-[8px] text-white/50 mt-0.5">{key}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
