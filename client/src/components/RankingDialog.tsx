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
    if (!seconds || seconds === 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(2);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-[#1a1428] rounded-3xl w-[320px] max-h-[480px] border border-white/20 overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">🏆 排行榜</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-3 bg-white/10 rounded-full p-1 shrink-0">
          {[{ key: 'total_time' as const, label: '总时长' }, { key: 'level' as const, label: '等级' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 text-[10px] py-1.5 rounded-full transition-all cursor-pointer ${tab === t.key ? 'bg-white/20 text-white font-semibold' : 'text-white/50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center px-4 py-2 text-[9px] text-white/30 border-b border-white/5 shrink-0">
          <span className="w-10">#</span>
          <span className="flex-1">用户</span>
          <span className="w-24 text-right">{tab === 'total_time' ? '总时长' : '等级'}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {loading ? (
            <div className="text-center text-white/40 text-xs py-8">加载中...</div>
          ) : data?.list?.length ? (
            data.list.map((entry) => {
              const isMe = entry.uid === data.my_rank?.uid;
              return (
                <div key={entry.uid}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs ${isMe ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-white/5'}`}>
                  <span className="w-10 text-center font-bold">
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <AvatarContainer avatarId={myAvatar || 'cat'} frameId={myAvatarFrame || 'none'} sizeClass="w-6 h-6" emojiSizeClass="text-xs" />
                    <span className="text-white text-xs font-medium truncate">
                      {entry.nickname}
                      {isMe && <span className="text-[9px] text-yellow-400 ml-1">(你)</span>}
                    </span>
                  </div>
                  <span className="text-white/70 text-[10px] font-mono w-24 text-right">
                    {tab === 'total_time' ? formatTime(entry.score) : `Lv.${entry.level}`}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center text-white/40 text-xs py-8">暂无数据</div>
          )}
        </div>

        {/* My rank footer */}
        {data?.my_rank && (
          <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-10 text-center font-bold text-yellow-400">
                #{data.my_rank.rank}
              </span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <AvatarContainer avatarId={myAvatar || 'cat'} frameId={myAvatarFrame || 'none'} sizeClass="w-6 h-6" emojiSizeClass="text-xs" />
                <span className="text-white text-xs font-medium truncate">{myNickname}</span>
              </div>
              <span className="text-white/70 text-[10px] font-mono w-24 text-right">
                {tab === 'total_time' ? formatTime(data.my_rank.score) : `Lv.${myLevel}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
