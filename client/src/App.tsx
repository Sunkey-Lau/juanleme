import { useState, useEffect, useRef } from 'react';
import { EditProfileDialog } from './components/EditProfileDialog';
import { RankingDialog } from './components/RankingDialog';
import { FriendsDialog } from './components/FriendsDialog';
import { SystemMessagesDialog } from './components/SystemMessagesDialog';
import { SettingsDialog, themeSkins, digitSkins } from './components/SettingsDialog';
import { DressUpDialog } from './components/DressUpDialog';
import { ActivityDialog } from './components/ActivityDialog';
import { CabbageAnimation } from './components/CabbageAnimation';
import { AvatarContainer } from './components/AvatarContainer';
import { AuthPage } from './components/AuthPage';
import { StickerIcon } from './components/StickerIcon';
import type { UserProfile } from './types';
import * as api from './api';

function getMaxExpForLevel(lvl: number): number {
  return 2 * Math.pow(lvl, 3) + 5 * Math.pow(lvl, 2) + 20 * lvl + 50;
}

export default function App() {
  // --- Auth ---
  const [authed, setAuthed] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Timer ---
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // --- Profile (server data) ---
  const [profile, setProfile] = useState<UserProfile>({
    id: '', uid: '', nickname: '用户昵称', email: null, phone: null,
    level: 1, exp: 0, maxExp: 77, total_time: 0, gold_coin: 0,
    avatar_id: 1, frame_id: 1, theme_skin_id: 1, font_skin_id: 1, animation_skin_id: 1,
  });

  // --- Local UI state (avatar/frame choosen in EditProfile) — 从 localStorage 持久化 ---
  const [localAvatar, setLocalAvatar] = useState(() => localStorage.getItem('juanleme_avatar') || 'cat');
  const [localFrame, setLocalFrame] = useState(() => localStorage.getItem('juanleme_frame') || 'none');
  const [localAnimationSkin, setLocalAnimationSkin] = useState(() => localStorage.getItem('juanleme_anime_skin') || 'cabbage');

  // --- Skin preferences ---
  const [skin, setSkin] = useState(() => localStorage.getItem('juanleme_skin') || 'default');
  const [timerDigitSkin, setTimerDigitSkin] = useState(() => localStorage.getItem('juanleme_digit_skin') || 'classic');

  // --- Dialog visibility ---
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRankingDialog, setShowRankingDialog] = useState(false);
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [showSystemMessages, setShowSystemMessages] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDressUpDialog, setShowDressUpDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  // --- Status ---
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toastText, setToastText] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const profileRef = useRef(profile);
  const timerStartRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const focusSnapshotRef = useRef<{ total_time: number; exp: number; level: number; maxExp: number; gold_coin: number } | null>(null);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Toast auto-clear
  useEffect(() => {
    if (toastText) {
      const t = setTimeout(() => setToastText(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastText]);

  const showToast = (txt: string) => setToastText(txt);

  // Check session on mount
  useEffect(() => {
    const token = localStorage.getItem('juanleme_token');
    if (token) {
      api.getUserProfile().then((res) => {
        if (res.code === 200 && res.data) {
          const u = res.data;
          setProfile(u);
          setAuthed(u);
          setTotalTime(u.total_time || 0);
        } else {
          api.clearTokens();
        }
        setLoading(false);
      }).catch(() => { api.clearTokens(); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  // Poll unread
  useEffect(() => {
    if (!authed) return;
    const poll = setInterval(async () => {
      try { const r = await api.getUnreadCount(); if (r.code === 200) setUnreadMessages(r.data.unread_count); } catch {}
    }, 15000);
    api.getUnreadCount().then((r) => { if (r.code === 200) setUnreadMessages(r.data.unread_count); }).catch(() => {});
    return () => clearInterval(poll);
  }, [authed]);

  // Timer logic — also updates totalTime / exp / coins / level in real time
  useEffect(() => {
    if (isRunning && timerStartRef.current) {
      const startTime = new Date(timerStartRef.current).getTime();
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        // 1) Update current timer display
        setCurrentTime(elapsed);

        // 2) Update total time (real time)
        const snapshot = focusSnapshotRef.current;
        if (snapshot) {
          const newTotal = snapshot.total_time + elapsed / 1000;
          setTotalTime(newTotal);

          // 3) Real-time exp & coin accumulation
          const earnedExp = elapsed / 60000;               // 1 exp per minute
          const earnedCoins = elapsed * 0.0000005;         // 0.0005 coin per second

          // 4) Recalculate level with overflow
          let newExp = snapshot.exp + earnedExp;
          let lvl = snapshot.level;
          let currMax = getMaxExpForLevel(lvl);
          while (newExp >= currMax) {
            newExp -= currMax;
            lvl += 1;
            currMax = getMaxExpForLevel(lvl);
          }

          setProfile((prev) => ({
            ...prev,
            total_time: newTotal,
            exp: newExp,
            maxExp: currMax,
            level: lvl,
            gold_coin: snapshot.gold_coin + earnedCoins,
          }));
        }
      }, 50);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTimerClock = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;
  };

  const handleLogin = (p: UserProfile) => {
    setProfile(p);
    setAuthed(p);
    setTotalTime(p.total_time || 0);
  };

  const handleLogout = () => {
    setIsRunning(false); setCurrentTime(0); setTotalTime(0);
    api.clearTokens(); setAuthed(null);
  };

  const handleStart = () => {
    // 如果上次结算还没完成，不允许开始
    if (isSubmittingRef.current) {
      showToast('⏳ 正在结算上次计时，请稍候...');
      return;
    }
    timerStartRef.current = new Date().toISOString();
    focusSnapshotRef.current = {
      total_time: totalTime,
      exp: profile.exp,
      level: profile.level,
      maxExp: profile.maxExp,
      gold_coin: profile.gold_coin,
    };
    setCurrentTime(0);
    setIsRunning(true);
  };

  const handleEnd = async () => {
    if (!timerStartRef.current) return;
    setIsRunning(false);
    isSubmittingRef.current = true;
    const startTime = timerStartRef.current;
    const endTime = new Date().toISOString();

    try {
      const res = await api.submitTimer(startTime, endTime);
      if (res.code === 200) {
        const { new_achievements } = res.data;
        if (new_achievements?.length > 0) {
          setUnreadMessages((p) => p + new_achievements.length);
          showToast(`🎉 解锁 ${new_achievements.length} 个新成就！`);
        }
      }
    } catch {}

    focusSnapshotRef.current = null;
    timerStartRef.current = null;
    setCurrentTime(0);
    isSubmittingRef.current = false;
  };

  const handleSaveProfile = (data: { nickname: string; avatar: string; avatarFrame: string }) => {
    setProfile((prev) => ({ ...prev, nickname: data.nickname }));
    setLocalAvatar(data.avatar);
    setLocalFrame(data.avatarFrame);
    setShowEditDialog(false);
    showToast('✨ 个人资料保存成功！');
  };

  const handleClaimActivity = (awardCoins: number, awardExp: number, toastMsg: string) => {
    setProfile((prev) => {
      let newExp = prev.exp + awardExp;
      let lvl = prev.level;
      let currMax = getMaxExpForLevel(lvl);
      while (newExp >= currMax) { newExp -= currMax; lvl += 1; currMax = getMaxExpForLevel(lvl); }
      return { ...prev, coins: prev.gold_coin + awardCoins, exp: newExp, maxExp: currMax, level: lvl };
    });
    showToast(toastMsg);
  };

  if (loading) {
    return <div className="min-h-screen w-full bg-[#120D1D] flex items-center justify-center">
      <div className="text-white/50 text-sm">加载中...</div>
    </div>;
  }

  if (!authed) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const activeSkinObj = themeSkins[skin] || themeSkins.default;

  return (
    <div className="min-h-screen w-full bg-[#120D1D] flex justify-center items-center text-white p-2 sm:p-6 font-sans">

      {/* App container — compact phone-like card */}
      <div className={`relative w-[345px] h-[670px] rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/20 flex flex-col p-4 select-none transition-all duration-700 ${activeSkinObj.bgClass} ${activeSkinObj.textColor}`}>

        {/* Profile header */}
        <div className="flex items-center gap-2.5 shrink-0 bg-transparent">
          <button onClick={() => setShowEditDialog(true)} className="relative shrink-0 cursor-pointer focus:outline-none">
            <AvatarContainer avatarId={localAvatar} frameId={localFrame} sizeClass="w-12 h-12" emojiSizeClass="text-2xl" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#451a03] flex items-center justify-center text-[9px] font-black text-amber-950 shadow-sm leading-none select-none">
              {profile.level}
            </div>
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5 px-1 bg-transparent">
            <button onClick={() => setShowEditDialog(true)} className="text-left font-black text-[13px] sm:text-sm truncate leading-tight cursor-pointer w-full">
              <span className={activeSkinObj.textColor}>{profile.nickname}</span>
            </button>

            <div className="flex items-center gap-1.5 leading-none select-none">
              <span className="text-[11px] text-amber-500 font-extrabold flex items-center gap-1 rounded">
                <StickerIcon type="coin" size={14} />
                {profile.gold_coin.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 leading-none mt-0.5">
              <div className="relative w-28 h-4 bg-black/10 rounded-full overflow-hidden flex items-center justify-center border border-[#451a03]/10">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (profile.exp / profile.maxExp) * 100)}%` }} />
                <span className="absolute text-[10px] font-bold font-mono text-white/95 tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  {((profile.exp / profile.maxExp) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right floating icon bar */}
        <div className="absolute right-3.5 top-18 z-20 flex flex-col items-center gap-4">
          <button onClick={() => setShowSettingsDialog(true)}
            className="transition-all hover:scale-115 hover:rotate-6 active:scale-90 duration-200 cursor-pointer focus:outline-none"
            title="设置"><StickerIcon type="settings" size={24} /></button>
          <button onClick={() => setShowFriendsDialog(true)}
            className="transition-all hover:scale-115 hover:-rotate-6 active:scale-90 duration-200 cursor-pointer focus:outline-none"
            title="好友"><StickerIcon type="friends" size={24} /></button>
          <button onClick={() => setShowSystemMessages(true)}
            className="transition-all hover:scale-115 hover:rotate-6 active:scale-90 duration-200 cursor-pointer relative focus:outline-none"
            title="消息通知">
            <StickerIcon type="bell" size={24} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center px-1 border border-white/35 shadow-md text-white animate-pulse">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </button>
          <button onClick={() => setShowRankingDialog(true)}
            className="transition-all hover:scale-115 hover:-rotate-6 active:scale-90 duration-200 cursor-pointer focus:outline-none"
            title="排行榜"><StickerIcon type="leaderboard" size={24} /></button>
          <button onClick={() => setShowDressUpDialog(true)}
            className="transition-all hover:scale-115 hover:rotate-6 active:scale-90 duration-200 cursor-pointer focus:outline-none"
            title="装扮中心"><StickerIcon type="dressup" size={24} /></button>
          <button onClick={() => setShowActivityDialog(true)}
            className="transition-all hover:scale-115 hover:-rotate-6 active:scale-90 duration-200 cursor-pointer focus:outline-none"
            title="活动礼包"><StickerIcon type="gift" size={24} /></button>
        </div>

        {/* Center mascot */}
        <div className="flex-1 flex items-center justify-center my-auto relative">
          <CabbageAnimation isEating={isRunning} animationSkin={localAnimationSkin} />
        </div>

        {/* Timer display */}
        <div className="flex flex-col items-center justify-center space-y-1 mt-auto shrink-0 pb-4 text-center">
          <div className={`text-4xl font-black font-mono tracking-widest leading-none ${digitSkins[timerDigitSkin]?.class || 'text-white'}`}>
            {formatTimerClock(totalTime * 1000)}
          </div>
          <div className="text-[15px] font-bold opacity-80 mt-1 leading-none pt-0.5">
            本次：{formatTimerClock(currentTime)}
          </div>
        </div>

        {/* Play button */}
        <div className="flex items-center justify-center shrink-0 py-2.5">
          <button onClick={isRunning ? handleEnd : handleStart}
            className="flex items-center justify-center cursor-pointer transition-all hover:scale-115 active:scale-90 focus:outline-none"
            title={isRunning ? '停止专注' : '开始专注'}>
            {isRunning ? <StickerIcon type="stop" size={38} /> : <StickerIcon type="play" size={38} className="ml-1" />}
          </button>
        </div>

      </div>

      {/* Dialogs */}
      <EditProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog}
        currentNickname={profile.nickname} currentAvatar={localAvatar} currentAvatarFrame={localFrame}
        onSave={handleSaveProfile} skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      <RankingDialog open={showRankingDialog} onOpenChange={setShowRankingDialog}
        myTotalTime={totalTime} myNickname={profile.nickname} myLevel={profile.level}
        myAvatar={localAvatar} myAvatarFrame={localFrame} skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      <FriendsDialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}
        skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      <SystemMessagesDialog open={showSystemMessages} onOpenChange={setShowSystemMessages}
        onUnreadChange={setUnreadMessages} skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}
        onLogout={handleLogout} profileName={profile.nickname}
        skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      <DressUpDialog open={showDressUpDialog} onOpenChange={setShowDressUpDialog}
        currentSkin={skin}
        onSkinChange={(newSkin) => { setSkin(newSkin); localStorage.setItem('juanleme_skin', newSkin); }}
        timerDigitSkin={timerDigitSkin}
        onTimerDigitSkinChange={(newSkin) => { setTimerDigitSkin(newSkin); localStorage.setItem('juanleme_digit_skin', newSkin); }}
        animationSkin={localAnimationSkin}
        onAnimationSkinChange={(s) => { setLocalAnimationSkin(s); localStorage.setItem('juanleme_anime_skin', s); }}
        skinGradientClass={activeSkinObj.bgClass} />

      <ActivityDialog open={showActivityDialog} onOpenChange={setShowActivityDialog}
        coins={profile.gold_coin} totalTime={totalTime} onClaimReward={handleClaimActivity}
        skinGradientClass={activeSkinObj.bgClass} currentSkin={skin} />

      {/* Toast */}
      {toastText && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/85 text-yellow-100 text-xs font-bold rounded-2xl shadow-xl border border-white/10 z-50">
          {toastText}
        </div>
      )}
    </div>
  );
}
