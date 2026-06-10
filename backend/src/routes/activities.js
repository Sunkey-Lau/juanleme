const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/activities
 */
router.get('/', (req, res) => {
  const db = getDB();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const activities = db.prepare(`
    SELECT * FROM activities
    WHERE (start_time IS NULL OR start_time <= ?) AND (end_time IS NULL OR end_time >= ?)
    ORDER BY type, id
  `).all(now, now);

  const userActs = db.prepare('SELECT * FROM user_activities WHERE user_id = ?').all(req.user.id);
  const userActMap = {};
  for (const ua of userActs) {
    userActMap[`${ua.activity_id}:${ua.task_id}`] = ua;
  }

  const result = activities.map(a => {
    let config = [];
    try { config = JSON.parse(a.task_config); } catch {}
    let rewards = {};
    try { rewards = JSON.parse(a.rewards); } catch {}

    const tasks = config.map(task => {
      const key = `${a.id}:${task.id}`;
      const progress = userActMap[key];
      return { task_id: task.id, target: task.target, progress: progress ? progress.progress : 0, status: progress ? progress.status : 'in_progress' };
    });

    return { ...a, task_config: config, rewards, tasks };
  });

  return success(res, result);
});

/**
 * POST /api/activities/join
 */
router.post('/join', (req, res) => {
  const { activity_id } = req.body;
  if (!activity_id) return fail(res, 400, '缺少活动 ID');

  const db = getDB();
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
  if (!activity) return fail(res, 404, '活动不存在');

  const existing = db.prepare('SELECT id FROM user_activities WHERE user_id = ? AND activity_id = ?').get(req.user.id, activity_id);
  if (existing) return fail(res, 400, '已加入该活动');

  let config = [];
  try { config = JSON.parse(activity.task_config); } catch {}

  const insert = db.prepare('INSERT INTO user_activities (user_id, activity_id, task_id, progress, status) VALUES (?, ?, ?, 0, \'in_progress\')');

  db.exec('BEGIN');
  try {
    for (const task of config) {
      insert.run(req.user.id, activity_id, task.id);
    }
    db.exec('COMMIT');
    return success(res, null, '已加入活动');
  } catch (err) {
    db.exec('ROLLBACK');
    return fail(res, 500, '加入活动失败');
  }
});

/**
 * POST /api/activities/claim
 */
router.post('/claim', (req, res) => {
  const { activity_id } = req.body;
  if (!activity_id) return fail(res, 400, '缺少活动 ID');

  const db = getDB();
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
  if (!activity) return fail(res, 404, '活动不存在');

  let rewards = {};
  try { rewards = JSON.parse(activity.rewards); } catch {}

  const incomplete = db.prepare(`
    SELECT COUNT(*) as cnt FROM user_activities
    WHERE user_id = ? AND activity_id = ? AND status = 'in_progress'
  `).get(req.user.id, activity_id);

  if (incomplete.cnt > 0) return fail(res, 400, '还有任务未完成');

  db.exec('BEGIN');
  try {
    if (rewards.exp) db.prepare('UPDATE users SET total_exp = total_exp + ? WHERE id = ?').run(rewards.exp, req.user.id);
    if (rewards.gold) db.prepare('UPDATE users SET gold_coin = gold_coin + ? WHERE id = ?').run(rewards.gold, req.user.id);
    if (rewards.items && Array.isArray(rewards.items)) {
      const insert = db.prepare('INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)');
      for (const itemId of rewards.items) insert.run(req.user.id, itemId);
    }
    db.prepare('UPDATE user_activities SET status = \'claimed\' WHERE user_id = ? AND activity_id = ?').run(req.user.id, activity_id);
    db.prepare('INSERT INTO notifications (user_id, type, title, content) VALUES (?, \'system\', \'活动奖励已领取\', ?)')
      .run(req.user.id, `领取了活动「${activity.name}」的奖励`);
    db.exec('COMMIT');
    return success(res, { rewards }, '奖励已领取');
  } catch (err) {
    db.exec('ROLLBACK');
    return fail(res, 500, '领取失败');
  }
});

module.exports = router;
