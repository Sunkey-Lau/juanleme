import type {
  ApiResponse,
  UserProfile,
  TimerSubmitResult,
  TimerRecord,
  TimerStats,
  ShopItem,
  Achievement,
  Friend,
  Notification,
  Activity,
  LeaderboardData,
} from '../types';

const API_BASE = '/api';

// ===== Token 管理 =====
function getAccessToken(): string | null {
  return localStorage.getItem('juanleme_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('juanleme_refresh_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('juanleme_token', access);
  localStorage.setItem('juanleme_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('juanleme_token');
  localStorage.removeItem('juanleme_refresh_token');
}

// ===== 通用请求 =====
async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (auth && getAccessToken()) {
    headers['Authorization'] = `Bearer ${getAccessToken()}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401 -> 尝试刷新 Token
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      return retryRes.json();
    } else {
      clearTokens();
      window.location.reload();
      throw new Error('Session expired');
    }
  }

  return res.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const rt = getRefreshToken();
    if (!rt) return false;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    const json = await res.json();
    if (json.code === 200) {
      setTokens(json.data.access_token, json.data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ===== Auth API =====

export async function sendCode(account: string, type: 'register' | 'login' | 'reset') {
  return request<{ code: string }>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ account, type }),
  }, false);
}

export async function register(account: string, code: string, password: string, nickname?: string) {
  const res = await request<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ account, code, password, nickname }),
  }, false);

  if (res.code === 200 && res.data) {
    setTokens(res.data.access_token, res.data.refresh_token);
  }
  return res;
}

export async function login(account: string, password: string) {
  const res = await request<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  }, false);

  if (res.code === 200 && res.data) {
    setTokens(res.data.access_token, res.data.refresh_token);
  }
  return res;
}

export async function loginByCode(account: string, code: string) {
  const res = await request<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>('/auth/login-code', {
    method: 'POST',
    body: JSON.stringify({ account, code }),
  }, false);

  if (res.code === 200 && res.data) {
    setTokens(res.data.access_token, res.data.refresh_token);
  }
  return res;
}

export async function demoLogin() {
  const res = await request<{
    access_token: string;
    refresh_token: string;
    user: UserProfile;
  }>('/auth/demo-login', {
    method: 'POST',
  }, false);

  if (res.code === 200 && res.data) {
    setTokens(res.data.access_token, res.data.refresh_token);
  }
  return res;
}

// ===== User API =====

export async function getUserProfile() {
  return request<UserProfile>('/user/profile');
}

export async function updateProfile(data: Record<string, any>) {
  return request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getInventory() {
  return request<{ items: ShopItem[]; grouped: Record<string, ShopItem[]> }>('/user/inventory');
}

export async function getUserAchievements() {
  return request<Achievement[]>('/user/achievements');
}

// ===== Timer API =====

export async function submitTimer(
  start_time: string,
  end_time: string,
  device_info?: string,
) {
  return request<TimerSubmitResult>('/timer/submit', {
    method: 'POST',
    body: JSON.stringify({ start_time, end_time, device_info }),
  });
}

export async function getTimerRecords(page = 1, limit = 20) {
  return request<{ data: TimerRecord[]; total: number; page: number; total_pages: number }>(
    `/timer/records?page=${page}&limit=${limit}`,
  );
}

export async function getTimerStats() {
  return request<TimerStats>('/timer/stats');
}

// ===== Shop API =====

export async function getShopItems(type?: string) {
  return request<{ items: ShopItem[]; grouped: Record<string, ShopItem[]> }>(
    `/shop/items${type ? `?type=${type}` : ''}`,
  );
}

export async function buyItem(item_id: number) {
  return request('/shop/buy', {
    method: 'POST',
    body: JSON.stringify({ item_id }),
  });
}

export async function equipItem(item_id: number) {
  return request('/shop/equip', {
    method: 'POST',
    body: JSON.stringify({ item_id }),
  });
}

// ===== Achievement API =====

export async function getAchievements() {
  return request<Achievement[]>('/achievements');
}

// ===== Leaderboard API =====

export async function getLeaderboard(type = 'total_time', limit = 100) {
  return request<LeaderboardData>(`/leaderboard?type=${type}&limit=${limit}`);
}

// ===== Friends API =====

export async function getFriends() {
  return request<Friend[]>('/friends');
}

export async function sendFriendRequest(friend_uid: string) {
  return request('/friends/request', {
    method: 'POST',
    body: JSON.stringify({ friend_uid }),
  });
}

export async function respondToFriendRequest(friendship_id: number, action: 'accept' | 'reject') {
  return request('/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ friendship_id, action }),
  });
}

export async function deleteFriend(friendship_id: number) {
  return request(`/friends/${friendship_id}`, { method: 'DELETE' });
}

// ===== Notifications API =====

export async function getNotifications(page = 1, limit = 20) {
  return request<{ data: Notification[]; total: number; page: number; total_pages: number }>(
    `/notifications?page=${page}&limit=${limit}`,
  );
}

export async function getUnreadCount() {
  return request<{ unread_count: number }>('/notifications/unread-count');
}

export async function markNotificationsRead(ids?: number[]) {
  return request('/notifications/read', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
}

// ===== Activities API =====

export async function getActivities() {
  return request<Activity[]>('/activities');
}

export async function joinActivity(activity_id: number) {
  return request('/activities/join', {
    method: 'POST',
    body: JSON.stringify({ activity_id }),
  });
}

export async function claimActivityReward(activity_id: number) {
  return request('/activities/claim', {
    method: 'POST',
    body: JSON.stringify({ activity_id }),
  });
}

// ===== Feedback API =====

export async function submitFeedback(content: string, images?: string[]) {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify({ content, images: JSON.stringify(images || []) }),
  });
}
