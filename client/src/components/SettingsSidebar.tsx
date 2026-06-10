import { useState, useEffect } from 'react';
import { X, LogOut, Palette, Type } from 'lucide-react';
import * as api from '../api';
import type { ShopItem } from '../types';

export const skins: Record<string, { name: string; gradient: string; color: string }> = {
  default: { name: '经典深紫', gradient: 'from-[#1a1333] to-[#2a1f44]', color: '#1a1333' },
  ocean: { name: '深海蓝', gradient: 'from-[#0a1628] to-[#1a2d4a]', color: '#0a1628' },
  sakura: { name: '樱花粉', gradient: 'from-[#2a1428] to-[#3d1f33]', color: '#2a1428' },
  forest: { name: '森林绿', gradient: 'from-[#0a1a12] to-[#1a2d1f]', color: '#0a1a12' },
  darkgold: { name: '暗夜黑金', gradient: 'from-[#0d0a0a] to-[#1f1a10]', color: '#0d0a0a' },
  cyberpunk: { name: '赛博朋克', gradient: 'from-[#0a0015] to-[#1a0040]', color: '#0a0015' },
};

export const digitSkins: Record<string, { name: string; class: string }> = {
  classic: { name: '经典白', class: 'text-white' },
  neon: { name: '霓虹蓝', class: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' },
  fire: { name: '火焰红', class: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' },
  rainbow: { name: '彩虹', class: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 to-cyan-400' },
};

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currentSkin: string;
  onSkinChange: (skin: string) => void;
  timerDigitSkin: string;
  onTimerDigitSkinChange: (skin: string) => void;
  profileName: string;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  onLogout,
  currentSkin,
  onSkinChange,
  timerDigitSkin,
  onTimerDigitSkinChange,
  profileName,
}: SettingsSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 max-w-[85vw] bg-[#1a1428] border-l border-white/10 h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">设置</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* User Info */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-white text-sm font-medium">{profileName}</div>
          </div>

          {/* Theme Skins */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Palette className="w-3.5 h-3.5 text-white/60" />
              <h4 className="text-xs text-white/60 uppercase tracking-wider">主题皮肤</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(skins).map(([key, skin]) => (
                <button
                  key={key}
                  onClick={() => onSkinChange(key)}
                  className={`p-2.5 rounded-xl text-[10px] text-white/80 border transition-all cursor-pointer ${
                    currentSkin === key
                      ? 'border-yellow-400/60 bg-yellow-400/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`h-6 rounded-lg mb-1 bg-gradient-to-br ${skin.gradient}`} />
                  <div className="truncate">{skin.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Digit Skins */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Type className="w-3.5 h-3.5 text-white/60" />
              <h4 className="text-xs text-white/60 uppercase tracking-wider">数字字体</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(digitSkins).map(([key, skin]) => (
                <button
                  key={key}
                  onClick={() => onTimerDigitSkinChange(key)}
                  className={`p-2.5 rounded-xl text-xs border transition-all cursor-pointer ${
                    timerDigitSkin === key
                      ? 'border-yellow-400/60 bg-yellow-400/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`font-mono font-bold ${skin.class}`}>88:88</div>
                  <div className="text-[9px] text-white/50 mt-0.5">{skin.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
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
