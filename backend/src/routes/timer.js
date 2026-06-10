const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { timerLimiter } = require('../middleware/rateLimiter');
const { success, fail } = require('../utils/response');
const { calcRewards, calcLevel } = require('../utils/levelCalc');
const { checkAchievements } = require('../services/achievementService');
const { updateActivityProgress } = require('../services/activityService');

const router = express.Router();
router.use(authMiddleware);

/**
 * POST /api/timer/submit
 * 提交计时记录
 */
router.post('/submit', timerLimiter, (req, res) => {
  const { start_time, end_time, device_info } = req.body;
  if (!start_time || !end_time) return fail(res, 400, '参数不完整');

  const startMs = new Date(start_time).getTime();
  const endMs = new Date(end_time).getTime();
  if (isNaN(startMs) || isNaN(endMs)) return fail(res, 400, '时间格式错误');
  if (endMs <= startMs) return fail(res, 400, '结束时间必须晚于开始时间');

  const durationSeconds = (endMs - startMs) / 1000;
  if (durationSeconds > 43200) return fail(res, 400, '单次计时不能超过 12 小时');
  if (durationSeconds < 1) return fail(res, 400, '计时太短（至少 1 秒）');

  const db = getDB();
  const overlap = db.prepare(`
    SELECT id FROM timer_records WHERE user_id = ? AND start_time < ? AND end_time > ?
  `).get(req.user.id, end_time, start_time);
  if (overlap) return fail(res, 400, '计时与已有记录重叠');

  const { exp, coin } = calcRewards(durationSeconds);

  db.exec('BEGIN');
  try {
    db.prepare(`
      INSERT INTO timer_records (user_id, start_time, end_time, duration, exp_earned, coin_earned, device_info)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, start_time, end_time, durationSeconds, exp, coin, device_info || null);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const newTotalTime = (user.total_time || 0) + durationSeconds;
    const newTotalExp = (user.total_exp || 0) + exp;
    const newGoldCoin = (user.gold_coin || 0) + coin;

    db.prepare('UPDATE users SET total_time = ?, total_exp = ?, gold_coin = ? WHERE id = ?')
      .run(newTotalTime, newTotalExp, newGoldCoin, req.user.id);

    const levelInfo = calcLevel(newTotalExp);
    const didLevelUp = levelInfo.level > (user.level || 1);
    if (didLevelUp) {
      db.prepare('UPDATE users SET level = ? WHERE id = ?').run(levelInfo.level, req.user.id);
    }

    db.exec('COMMIT');

    const userData = { total_time: newTotalTime, total_exp: newTotalExp, gold_coin: newGoldCoin, level: levelInfo.level };
    const newAchievements = checkAchievements(req.user.id, userData);
    const activityUpdates = updateActivityProgress(req.user.id, durationSeconds, exp, coin);

    return success(res, {
      exp_earned: Math.round(exp * 100) / 100,
      coin_earned: Math.round(coin * 1000000) / 1000000,
      level: levelInfo.level,
      current_exp: Math.round(levelInfo.currentExp * 100) / 100,
      max_exp: Math.round(levelInfo.maxExp * 100) / 100,
      did_level_up: didLevelUp,
      new_achievements: newAchievements.map(a => ({ id: a.id, name: a.name, description: a.description })),
      activity_updates: activityUpdates,
    }, '计时提交成功');
  } catch (err) {
    db.exec('ROLLBACK');
    return fail(res, 500, '提交失败: ' + err.message);
  }
});

/**
 * GET /api/timer/records
 */
router.get('/records', (req, res) => {
  const db = getDB();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as cnt FROM timer_records WHERE user_id = ?').get(req.user.id).cnt;
  const records = db.prepare(`
    SELECT id, start_time, end_time, duration, exp_earned, coin_earned, created_at
    FROM timer_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);

  return success(res, { data: records, total, page, total_pages: Math.ceil(total / limit) });
});

/**
 * GET /api/timer/stats
 */
router.get('/stats', (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT total_time, total_exp, gold_coin, level FROM users WHERE id = ?').get(req.user.id);

  const today = db.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total FROM timer_records
    WHERE user_id = ? AND date(created_at) = date('now')
  `).get(req.user.id);

  const week = db.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total FROM timer_records
    WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
  `).get(req.user.id);

  const month = db.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total FROM timer_records
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(req.user.id);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM timer_records WHERE user_id = ?').get(req.user.id);
  const streakDays = db.prepare(`
    SELECT COUNT(DISTINCT date(created_at)) as days FROM timer_records
    WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
  `).get(req.user.id);

  return success(res, {
    total_time: user.total_time || 0, total_exp: user.total_exp || 0,
    gold_coin: user.gold_coin || 0, level: user.level || 1,
    today_seconds: today.total, week_seconds: week.total, month_seconds: month.total,
    total_focus_count: count.cnt, active_days_30: streakDays.days,
  });
});

module.exports = router;
