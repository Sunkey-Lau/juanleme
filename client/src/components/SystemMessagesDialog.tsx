import { useState, useEffect } from 'react';
import * as api from '../api';
import type { Notification } from '../types';

interface SystemMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadChange?: (count: number) => void;
  skinGradientClass?: string;
}

export function SystemMessagesDialog({ open, onOpenChange, onUnreadChange, skinGradientClass }: SystemMessagesDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.getNotifications(1, 50);
    if (res.code === 200) setNotifications(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && !loaded) { load(); setLoaded(true); }
  }, [open, loaded]);

  const handleMarkRead = async (ids?: number[]) => {
    const res = await api.markNotificationsRead(ids);
    if (res.code === 200) {
      if (!ids) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      } else {
        setNotifications((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, is_read: 1 } : n));
      }
      onUnreadChange?.(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) { case 'achievement': return '🎉'; case 'friend': return '👋'; default: return '📢'; }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => onOpenChange(false)}>
      <div className={`rounded-3xl w-[320px] h-[480px] border border-white/20 overflow-hidden shadow-2xl flex flex-col ${skinGradientClass || 'bg-[#1a1428]'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="text-white font-semibold text-sm">🔔 消息通知</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => handleMarkRead()} className="text-[9px] text-white/50 hover:text-white/80 cursor-pointer transition-colors">全部已读</button>
            <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
              <span className="text-sm">✕</span>
            </button>
          </div>
        </div>

        {/* 固定高度区域，内容溢出滚动 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white/40 text-[10px]">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/30 text-[10px]">暂无消息</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && handleMarkRead([n.id])}
                className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer ${n.is_read ? 'bg-white/5' : 'bg-white/10'}`}>
                <span className="text-sm">{getIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[10px] font-medium">{n.title}</div>
                  {n.content && <div className="text-[9px] text-white/50 mt-0.5">{n.content}</div>}
                </div>
                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 mt-1" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
