import { useState, useEffect } from 'react';
import * as api from '../api';
import type { Friend } from '../types';

interface FriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skinGradientClass?: string;
  currentSkin?: string;
}

export function FriendsDialog({ open, onOpenChange, skinGradientClass }: FriendsDialogProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [searchUid, setSearchUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadFriends = async () => {
    setLoading(true);
    const res = await api.getFriends();
    if (res.code === 200) {
      setFriends(res.data.filter((f) => f.status === 'accepted'));
      setPending(res.data.filter((f) => f.status === 'pending'));
    }
    setLoading(false);
  };

  useEffect(() => { if (open) loadFriends(); }, [open]);

  const handleSendRequest = async () => {
    if (!searchUid.trim()) return;
    const res = await api.sendFriendRequest(searchUid.trim());
    setMessage(res.message);
    if (res.code === 200) setSearchUid('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRespond = async (id: number, action: 'accept' | 'reject') => {
    const res = await api.respondToFriendRequest(id, action);
    if (res.code === 200) loadFriends();
    setMessage(res.message);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`rounded-3xl w-[320px] h-[480px] border border-white/20 overflow-hidden shadow-2xl flex flex-col ${skinGradientClass || 'bg-[#1a1428]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">👥 好友</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          <div className="flex gap-2">
            <input type="text" placeholder="输入好友 UID" value={searchUid} onChange={(e) => setSearchUid(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl py-2 px-3 text-white text-[10px] outline-none focus:border-white/40"
              onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()} />
            <button onClick={handleSendRequest}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-white text-[10px] transition-all cursor-pointer">
              添加
            </button>
          </div>
          {message && <div className="mt-1 text-[9px] text-white/50 text-center">{message}</div>}
        </div>

        {pending.length > 0 && (
          <div className="p-3 border-b border-white/10">
            <div className="text-[9px] text-white/40 mb-1">待处理请求</div>
            {pending.map((p) => (
              <div key={p.friendship_id} className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg mb-1">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{p.nickname[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[10px] truncate">{p.nickname}</div>
                </div>
                <button onClick={() => handleRespond(p.friendship_id, 'accept')}
                  className="text-[10px] px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 cursor-pointer">✓</button>
                <button onClick={() => handleRespond(p.friendship_id, 'reject')}
                  className="text-[10px] px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 cursor-pointer">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-[9px] text-white/40 mb-1">好友列表 ({friends.length})</div>
          {loading ? (
            <div className="text-center text-white/40 text-[10px] py-3">加载中...</div>
          ) : friends.length === 0 ? (
            <div className="text-center text-white/30 text-[10px] py-6">还没有好友</div>
          ) : (
            friends.map((f) => (
              <div key={f.friendship_id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{f.nickname[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{f.nickname}</div>
                  <div className="text-[9px] text-white/40">Lv.{f.level}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
