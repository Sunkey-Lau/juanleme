const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', '..', 'juanleme.db');
let db = null;

function getDB() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL DEFAULT '新用户',
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      avatar_id INTEGER DEFAULT 1,
      frame_id INTEGER DEFAULT 1,
      theme_skin_id INTEGER DEFAULT 1,
      font_skin_id INTEGER DEFAULT 1,
      animation_skin_id INTEGER DEFAULT 1,
      total_time REAL DEFAULT 0,
      total_exp REAL DEFAULT 0,
      gold_coin REAL DEFAULT 0,
      level INTEGER DEFAULT 1,
      status INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 用户认证表（验证码）
    CREATE TABLE IF NOT EXISTS user_auths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('register','login','reset')),
      expired_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 计时记录表
    CREATE TABLE IF NOT EXISTS timer_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration REAL NOT NULL,
      exp_earned REAL DEFAULT 0,
      coin_earned REAL DEFAULT 0,
      device_info TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 成就定义表
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      condition_type TEXT NOT NULL,
      condition_value REAL NOT NULL
    );

    -- 用户成就表
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      achievement_id INTEGER NOT NULL REFERENCES achievements(id),
      unlocked_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id)
    );

    -- 装扮物品表
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('avatar','frame','theme','font','animation')),
      name TEXT NOT NULL,
      description TEXT,
      price_gold REAL DEFAULT 0,
      price_activity_id INTEGER,
      icon_url TEXT,
      is_default INTEGER DEFAULT 0
    );

    -- 用户背包表
    CREATE TABLE IF NOT EXISTS user_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity INTEGER DEFAULT 1,
      acquired_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, item_id)
    );

    -- 好友关系表
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      friend_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    );

    -- 通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL DEFAULT 'system' CHECK(type IN ('system','friend','achievement')),
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      related_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 活动表
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('daily','weekly','monthly','limited')),
      task_config TEXT,
      rewards TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 用户活动进度表
    CREATE TABLE IF NOT EXISTS user_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      activity_id INTEGER NOT NULL REFERENCES activities(id),
      task_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress','claimed')),
      UNIQUE(user_id, activity_id, task_id)
    );

    -- 反馈表
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      images TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved')),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('Database tables initialized successfully.');
  return db;
}

module.exports = { getDB, initDB };
