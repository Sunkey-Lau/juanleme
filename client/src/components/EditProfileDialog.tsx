import { useState, useEffect } from 'react';
import * as api from '../api';
import { AvatarContainer } from './AvatarContainer';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNickname: string;
  currentAvatar: string;
  currentAvatarFrame: string;
  onSave: (data: { nickname: string; avatar: string; avatarFrame: string }) => void;
  skinGradientClass?: string;
  currentSkin?: string;
}

const avatarOptions = ['cat', 'dog', 'rabbit', 'bear', 'panda', 'lion', 'fox', 'frog', 'unicorn', 'ghost', 'alien', 'robot'];
const frameOptions = ['none', 'fire', 'star', 'crown', 'rainbow', 'diamond', 'heart'];

export function EditProfileDialog({
  open, onOpenChange, currentNickname, currentAvatar, currentAvatarFrame, onSave,
}: EditProfileDialogProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [avatarFrame, setAvatarFrame] = useState(currentAvatarFrame);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNickname(currentNickname);
      setAvatar(currentAvatar);
      setAvatarFrame(currentAvatarFrame);
    }
  }, [open, currentNickname, currentAvatar, currentAvatarFrame]);

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    // Update nickname via API
    await api.updateProfile({ nickname: nickname.trim() });
    // Since avatar/frame are emoji-based (UI only for now), save locally
    onSave({ nickname: nickname.trim(), avatar, avatarFrame });
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1428] rounded-3xl w-[320px] max-h-[480px] border border-white/20 overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">个性化设置</h3>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
            <span className="text-sm">✕</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preview */}
          <div className="flex justify-center mb-2">
            <AvatarContainer avatarId={avatar} frameId={avatarFrame} sizeClass="w-16 h-16" emojiSizeClass="text-3xl" />
          </div>

          {/* Nickname */}
          <div>
            <label className="text-[10px] text-white/50 mb-1 block">昵称</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white text-xs outline-none focus:border-white/40" />
          </div>

          {/* Avatar selection */}
          <div>
            <label className="text-[10px] text-white/50 mb-1.5 block">选择头像</label>
            <div className="grid grid-cols-6 gap-2">
              {avatarOptions.map((a) => (
                <button key={a} onClick={() => setAvatar(a)}
                  className={`p-1 rounded-xl transition-all cursor-pointer ${avatar === a ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                  <AvatarContainer avatarId={a} frameId="none" sizeClass="w-full aspect-square" emojiSizeClass="text-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Frame selection */}
          <div>
            <label className="text-[10px] text-white/50 mb-1.5 block">头像框</label>
            <div className="flex gap-2">
              {frameOptions.map((f) => (
                <button key={f} onClick={() => setAvatarFrame(f)}
                  className={`flex-1 py-2 rounded-xl text-[10px] transition-all cursor-pointer ${avatarFrame === f ? 'bg-yellow-400/20 border border-yellow-400/50 text-yellow-200' : 'bg-white/10 hover:bg-white/20 text-white/60 border border-transparent'}`}>
                  {f === 'none' ? '无' : f}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !nickname.trim()}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer text-sm">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
