import { useState } from "react";
import { LogOut, Palette, Type as TypeIcon, Sparkles } from "lucide-react";

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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  profileName: string;
  skinGradientClass?: string;
  currentSkin?: string;
}

export function SettingsDialog({
  open, onOpenChange, onLogout, profileName,
}: SettingsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1428] rounded-3xl w-[320px] border border-white/20 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">设置</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white text-sm font-medium">{profileName}</div>
          </div>
          <button
            onClick={() => { onLogout(); onOpenChange(false); }}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
