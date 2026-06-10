export interface UserProfile {
  id: string;
  uid: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  level: number;
  exp: number;
  maxExp: number;
  total_time: number;
  gold_coin: number;
  avatar_id: number;
  frame_id: number;
  theme_skin_id: number;
  font_skin_id: number;
  animation_skin_id: number;
  avatar_item?: ShopItem | null;
  frame_item?: ShopItem | null;
  focus_count?: number;
  achievement_count?: number;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  total?: number;
  page?: number;
  total_pages?: number;
}

export interface TimerRecord {
  id: number;
  start_time: string;
  end_time: string;
  duration: number;
  exp_earned: number;
  coin_earned: number;
  created_at: string;
}

export interface TimerSubmitResult {
  exp_earned: number;
  coin_earned: number;
  level: number;
  current_exp: number;
  max_exp: number;
  did_level_up: boolean;
  new_achievements: { id: number; name: string; description: string }[];
  activity_updates: any[];
}

export interface TimerStats {
  total_time: number;
  total_exp: number;
  gold_coin: number;
  level: number;
  today_seconds: number;
  week_seconds: number;
  month_seconds: number;
  total_focus_count: number;
  active_days_30: number;
}

export interface ShopItem {
  id: number;
  type: 'avatar' | 'frame' | 'theme' | 'font' | 'animation';
  name: string;
  description: string;
  price_gold: number;
  icon_url: string | null;
  is_default: number;
  owned: boolean;
  purchasable: boolean;
}

export interface Achievement {
  id: number;
  key: string;
  name: string;
  description: string;
  icon_url: string | null;
  condition_type: string;
  condition_value: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface Friend {
  friendship_id: number;
  friend_id: string;
  uid: string;
  nickname: string;
  avatar_id: number;
  level: number;
  total_time: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'system' | 'friend' | 'achievement';
  title: string;
  content: string;
  is_read: number;
  related_id: number | null;
  created_at: string;
}

export interface Activity {
  id: number;
  name: string;
  type: string;
  task_config: any[];
  rewards: any;
  start_time: string | null;
  end_time: string | null;
  tasks: { task_id: string; target: number; progress: number; status: string }[];
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  nickname: string;
  avatar_id: number;
  level: number;
  score: number;
}

export interface LeaderboardData {
  type: string;
  list: LeaderboardEntry[];
  my_rank: LeaderboardEntry | null;
}
