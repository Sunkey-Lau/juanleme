import { useState } from 'react';
import { User, Mail, Lock, LogIn } from 'lucide-react';
import { demoLogin, login, register, sendCode, loginByCode } from '../api';
import type { UserProfile } from '../types';

interface AuthPageProps {
  onLogin: (profile: UserProfile) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'code-login'>('login');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCode, setShowCode] = useState('');

  const handleSendCode = async () => {
    if (!account) { setError('请输入手机号或邮箱'); return; }
    setLoading(true);
    setError('');
    const type = mode === 'register' ? 'register' : 'login';
    const res = await sendCode(account, type);
    setLoading(false);
    if (res.code === 200) {
      setCodeSent(true);
      setShowCode(res.data.code);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } else {
      setError(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (mode === 'register') {
        res = await register(account, code, password, nickname);
      } else if (mode === 'code-login') {
        res = await loginByCode(account, code);
      } else {
        res = await login(account, password);
      }

      if (res.code === 200 && res.data) {
        onLogin(res.data.user);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await demoLogin();
      if (res.code === 200 && res.data) {
        onLogin(res.data.user);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#181124] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🥬</div>
          <h1 className="text-3xl font-bold text-white mb-1">卷了么</h1>
          <p className="text-sm text-white/50">你的时间 · 终将伟大</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          {/* Mode Tabs */}
          <div className="flex mb-6 bg-white/10 rounded-full p-1">
            {(['login', 'register', 'code-login'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setCodeSent(false); setShowCode(''); setCode(''); }}
                className={`flex-1 text-xs py-2 rounded-full transition-all cursor-pointer ${
                  mode === m ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {m === 'login' ? '密码登录' : m === 'register' ? '注册' : '验证码登录'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="手机号 / 邮箱"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {/* Nickname (register only) */}
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="昵称（可选）"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/40 transition-colors"
                />
              </div>
            )}

            {/* Password (login & register) */}
            {mode !== 'code-login' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/40 transition-colors"
                />
              </div>
            )}

            {/* Code (register & code-login) */}
            {(mode === 'register' || mode === 'code-login') && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                  className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-white text-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码'}
                </button>
              </div>
            )}
            {/* 开发模式：显示验证码 */}
            {showCode && (
              <div className="text-center py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="text-[10px] text-amber-300/60">🔧 开发模式验证码：</span>
                <span className="text-lg font-bold text-amber-300 font-mono tracking-widest ml-1">{showCode}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-300 text-xs text-center bg-red-500/10 rounded-lg py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#E5A93C] text-[#181124] font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '注册' : '登录'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30">或者</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Demo Login */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            体验账号一键登录
          </button>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          注册即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
}
