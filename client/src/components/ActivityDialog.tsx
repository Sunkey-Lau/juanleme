import { useState } from 'react';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coins: number;
  totalTime: number;
  onClaimReward: (awardCoins: number, awardExp: number, toastMsg: string) => void;
  skinGradientClass?: string;
  currentSkin?: string;
}

export function ActivityDialog({
  open, onOpenChange, coins, totalTime, onClaimReward,
}: ActivityDialogProps) {
  const [claimedDaily, setClaimedDaily] = useState(false);

  if (!open) return null;

  const totalMinutes = Math.floor(totalTime / 60000);

  const handleClaimDaily = () => {
    const award = Math.floor(totalMinutes / 5) + 1;
    onClaimReward(award, award * 10, `🎁 领取了日常奖励 ${award} 金币！`);
    setClaimedDaily(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1428] rounded-3xl w-[320px] border border-white/20 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">🎁 活动礼包</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-white text-sm font-medium">每日活跃奖励</div>
            <div className="text-[10px] text-white/40 mt-1">今日专注 {totalMinutes} 分钟</div>
          </div>

          {!claimedDaily ? (
            <button
              onClick={handleClaimDaily}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl transition-all hover:opacity-90 cursor-pointer text-sm"
            >
              领取奖励 🎁
            </button>
          ) : (
            <div className="w-full py-3 bg-white/10 text-white/50 font-bold rounded-xl text-sm text-center">
              已领取 ✅
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-[10px] text-white/40 mb-1">我的资产</div>
            <div className="flex justify-between text-white text-sm">
              <span>🪙 金币</span>
              <span className="font-mono">{coins.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
