import { useState, useEffect } from 'react';
import * as api from '../api';
import type { LeaderboardData } from '../types';
import { AvatarContainer } from './AvatarContainer';

interface RankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myNickname: string;
  myLevel: number;
  myTotalTime: number;
  myAvatar?: string;
  myAvatarFrame?: string;
  skinGradientClass?: string;
  currentSkin?: string;
}

export function RankingDialog({
  open, onOpenChange, myNickname, myLevel, myTotalTime, myAvatar, myAvatarFrame,
}: RankingDialogProps) {
  const [tab, setTab] = useState<'total_time' | 'level'>('total_time');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.getLeaderboard(tab).then((res) => {
        if (res.code === 200) setData(res.data);
        setLoading(false);
      });
    }
  }, [open, tab]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1428] rounded-3xl w-[320px] max-h-[480px] border border-white/20 overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">🏆 排行榜</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>

        <div className="flex mx-4 mt-3 bg-white/10 rounded-full p-1">
          {[{ key: 'total_time', label: '总时长' }, { key: 'level', label: '等级' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 text-[10px] py-1.5 rounded-full transition-all cursor-pointer ${tab === t.key ? 'bg-white/20 text-white font-semibold' : 'text-white/50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="text-center text-white/40 text-xs py-4">加载中...</div>
          ) : data?.list?.length ? (
            data.list.slice(0, 20).map((entry) => (
              <div key={entry.rank}
                className={`flex items-center gap-2 p-2 rounded-xl ${entry.uid === data.my_rank?.uid ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'}`}>
                <span className="w-5 text-center text-xs font-bold">
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{entry.nickname}</div>
                  <div className="text-[9px] text-white/40">Lv.{entry.level}</div>
                </div>
                <div className="text-white text-[10px] font-mono">
                  {tab === 'total_time' ? formatTime(entry.score) : `Lv.${entry.level}`}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/40 text-xs py-4">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
