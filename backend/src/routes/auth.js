const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { JWT_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, BCRYPT_SALT_ROUNDS } = require('../config/auth');
const { generateUID, generateCode } = require('../utils/helpers');
const { success, fail } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/auth/send-code
 * 发送验证码（模拟 - 直接返回验证码）
 */
router.post('/send-code', authLimiter, (req, res) => {
  const { account, type } = req.body;
  if (!account || !type) return fail(res, 400, '参数不完整');
  if (!['register', 'login', 'reset'].includes(type)) return fail(res, 400, '无效的验证码类型');

  const db = getDB();

  const recent = db.prepare(`
    SELECT created_at FROM user_auths
    WHERE account = ? AND type = ? AND used = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(account, type);

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.created_at + 'Z').getTime()) / 1000;
    if (elapsed < 60) {
      return fail(res, 429, `请 ${Math.ceil(60 - elapsed)} 秒后再试`);
    }
  }

  const code = generateCode();
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(`
    INSERT INTO user_auths (account, code, type, expired_at)
    VALUES (?, ?, ?, ?)
  `).run(account, code, type, expiredAt);

  return success(res, { code, expired_at: expiredAt }, '验证码已发送（开发模式）');
});

/**
 * POST /api/auth/register
 * 注册新用户
 */
router.post('/register', authLimiter, (req, res) => {
  const { account, code, password, nickname } = req.body;
  if (!account || !code || !password) return fail(res, 400, '参数不完整');

  const db = getDB();

  const authRecord = db.prepare(`
    SELECT * FROM user_auths
    WHERE account = ? AND code = ? AND type = 'register' AND used = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(account, code);

  if (!authRecord) return fail(res, 400, '验证码错误');
  if (new Date(authRecord.expired_at + 'Z') < new Date()) return fail(res, 400, '验证码已过期');

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(account, account);
  if (existing) return fail(res, 400, '该账号已注册');

  const passwordHash = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
  const uid = generateUID();
  const isEmail = account.includes('@');

  db.exec('BEGIN');

  try {
    const insertUser = db.prepare(`
      INSERT INTO users (uid, nickname, email, phone, password_hash, total_time, total_exp, gold_coin, level, avatar_id, frame_id, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 1, 1, 1, datetime('now'))
    `);
    const result = insertUser.run(uid, nickname || '新用户', isEmail ? account : null, isEmail ? null : account, passwordHash);
    const userId = Number(result.lastInsertRowid);

    const defaultItems = db.prepare('SELECT id FROM items WHERE is_default = 1').all();
    const insertItem = db.prepare('INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)');
    for (const item of defaultItems) {
      insertItem.run(userId, item.id);
    }

    db.prepare('UPDATE user_auths SET used = 1 WHERE id = ?').run(authRecord.id);

    db.exec('COMMIT');

    const accessToken = jwt.sign({ id: userId, uid }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: userId, uid, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

    return success(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: String(userId), uid,
        nickname: nickname || '新用户',
        email: isEmail ? account : null,
        phone: isEmail ? null : account,
        level: 1, exp: 0, maxExp: 77,
        total_time: 0, gold_coin: 0,
        avatar_id: 1, frame_id: 1,
      },
    }, '注册成功');
  } catch (err) {
    db.exec('ROLLBACK');
    return fail(res, 500, '注册失败: ' + err.message);
  }
});

/**
 * POST /api/auth/login
 * 密码登录
 */
router.post('/login', authLimiter, (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) return fail(res, 400, '参数不完整');

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(account, account);
  if (!user) return fail(res, 401, '账号或密码错误');
  if (user.status === 1) return fail(res, 403, '账号已被冻结');
  if (!bcrypt.compareSync(password, user.password_hash)) return fail(res, 401, '账号或密码错误');

  const accessToken = jwt.sign({ id: user.id, uid: user.uid }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ id: user.id, uid: user.uid, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

  const { calcLevel } = require('../utils/levelCalc');
  const levelInfo = calcLevel(user.total_exp || 0);

  return success(res, {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: String(user.id), uid: user.uid,
      nickname: user.nickname, email: user.email, phone: user.phone,
      level: levelInfo.level, exp: levelInfo.currentExp, maxExp: levelInfo.maxExp,
      total_time: user.total_time || 0, gold_coin: user.gold_coin || 0,
      avatar_id: user.avatar_id, frame_id: user.frame_id,
    },
  }, '登录成功');
});

/**
 * POST /api/auth/login-code
 * 验证码登录
 */
router.post('/login-code', authLimiter, (req, res) => {
  const { account, code } = req.body;
  if (!account || !code) return fail(res, 400, '参数不完整');

  const db = getDB();

  const authRecord = db.prepare(`
    SELECT * FROM user_auths
    WHERE account = ? AND code = ? AND type = 'login' AND used = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(account, code);

  if (!authRecord) return fail(res, 400, '验证码错误');
  if (new Date(authRecord.expired_at + 'Z') < new Date()) return fail(res, 400, '验证码已过期');

  const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(account, account);
  if (!user) return fail(res, 404, '账号未注册，请先注册');

  db.prepare('UPDATE user_auths SET used = 1 WHERE id = ?').run(authRecord.id);

  const accessToken = jwt.sign({ id: user.id, uid: user.uid }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ id: user.id, uid: user.uid, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

  const { calcLevel } = require('../utils/levelCalc');
  const levelInfo = calcLevel(user.total_exp || 0);

  return success(res, {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: String(user.id), uid: user.uid,
      nickname: user.nickname, email: user.email, phone: user.phone,
      level: levelInfo.level, exp: levelInfo.currentExp, maxExp: levelInfo.maxExp,
      total_time: user.total_time || 0, gold_coin: user.gold_coin || 0,
      avatar_id: user.avatar_id, frame_id: user.frame_id,
    },
  }, '登录成功');
});

/**
 * POST /api/auth/refresh
 * 刷新 Token
 */
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return fail(res, 400, '缺少 refresh_token');

  try {
    const decoded = jwt.verify(refresh_token, JWT_SECRET);
    if (decoded.type !== 'refresh') return fail(res, 401, '无效的 Refresh Token');

    const db = getDB();
    const user = db.prepare('SELECT id, uid, status FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.status === 1) return fail(res, 401, '用户不存在或被冻结');

    const accessToken = jwt.sign({ id: user.id, uid: user.uid }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
    const newRefreshToken = jwt.sign({ id: user.id, uid: user.uid, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

    return success(res, { access_token: accessToken, refresh_token: newRefreshToken });
  } catch {
    return fail(res, 401, 'Refresh Token 已过期，请重新登录');
  }
});

/**
 * POST /api/auth/demo-login
 * 一键登录体验账号
 */
router.post('/demo-login', authLimiter, (req, res) => {
  const db = getDB();

  let demoUser = db.prepare("SELECT * FROM users WHERE email = 'demo@juanleme.app'").get();

  if (!demoUser) {
    const passwordHash = bcrypt.hashSync('demo123', BCRYPT_SALT_ROUNDS);
    const uid = generateUID();

    db.exec('BEGIN');
    try {
      const result = db.prepare(`
        INSERT INTO users (uid, nickname, email, password_hash, total_time, total_exp, gold_coin, level, avatar_id, frame_id, created_at)
        VALUES (?, '体验用户', 'demo@juanleme.app', ?, 36000, 500, 120, 3, 1, 1, datetime('now'))
      `).run(uid, passwordHash);

      demoUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid));

      const defaultItems = db.prepare('SELECT id FROM items WHERE is_default = 1').all();
      const insertItem = db.prepare('INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)');
      for (const item of defaultItems) {
        insertItem.run(demoUser.id, item.id);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      return fail(res, 500, '创建体验账号失败');
    }
  }

  const accessToken = jwt.sign({ id: demoUser.id, uid: demoUser.uid }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ id: demoUser.id, uid: demoUser.uid, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });

  const { calcLevel } = require('../utils/levelCalc');
  const levelInfo = calcLevel(demoUser.total_exp || 0);

  return success(res, {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: String(demoUser.id), uid: demoUser.uid,
      nickname: demoUser.nickname, email: demoUser.email, phone: demoUser.phone,
      level: levelInfo.level, exp: levelInfo.currentExp, maxExp: levelInfo.maxExp,
      total_time: demoUser.total_time || 0, gold_coin: demoUser.gold_coin || 0,
      avatar_id: demoUser.avatar_id, frame_id: demoUser.frame_id,
    },
  }, '登录成功');
});

module.exports = router;
