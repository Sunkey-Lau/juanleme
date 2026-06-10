const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/juanleme',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

async function initDB() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(12) UNIQUE NOT NULL,
        nickname VARCHAR(30) NOT NULL DEFAULT '新用户',
        email VARCHAR(100),
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        avatar_id INTEGER DEFAULT 1,
        frame_id INTEGER DEFAULT 1,
        theme_skin_id INTEGER DEFAULT 1,
        font_skin_id INTEGER DEFAULT 1,
        animation_skin_id INTEGER DEFAULT 1,
        total_time DOUBLE PRECISION DEFAULT 0,
        total_exp DOUBLE PRECISION DEFAULT 0,
        gold_coin DOUBLE PRECISION DEFAULT 0,
        level INTEGER DEFAULT 1,
        status SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_auths (
        id SERIAL PRIMARY KEY,
        account VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK(type IN ('register','login','reset')),
        expired_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS timer_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration DOUBLE PRECISION NOT NULL,
        exp_earned DOUBLE PRECISION DEFAULT 0,
        coin_earned DOUBLE PRECISION DEFAULT 0,
        device_info TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url VARCHAR(255),
        condition_type VARCHAR(30) NOT NULL,
        condition_value DOUBLE PRECISION NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        achievement_id INTEGER NOT NULL REFERENCES achievements(id),
        unlocked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK(type IN ('avatar','frame','theme','font','animation')),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price_gold DOUBLE PRECISION DEFAULT 0,
        price_activity_id INTEGER,
        icon_url VARCHAR(255),
        is_default BOOLEAN DEFAULT FALSE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_id INTEGER NOT NULL REFERENCES items(id),
        quantity INTEGER DEFAULT 1,
        acquired_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, item_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        friend_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, friend_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(20) NOT NULL DEFAULT 'system' CHECK(type IN ('system','friend','achievement')),
        title VARCHAR(100) NOT NULL,
        content TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK(type IN ('daily','weekly','monthly','limited')),
        task_config JSONB,
        rewards JSONB,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        activity_id INTEGER NOT NULL REFERENCES activities(id),
        task_id VARCHAR(20) NOT NULL,
        progress INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'in_progress' CHECK(status IN ('in_progress','claimed')),
        UNIQUE(user_id, activity_id, task_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        images JSONB,
        status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved')),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized successfully.');
  } finally {
    client.release();
  }
}

async function getDB() {
  return getPool();
}

module.exports = { getPool, getDB, initDB };
