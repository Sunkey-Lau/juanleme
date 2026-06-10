const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { calcLevel } = require('../utils/levelCalc');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/user/profile
 */
router.get('/profile', (req, res) => {
  const db = getDB();
  const user = db.prepare(`
    SELECT id, uid, nickname, email, phone, avatar_id, frame_id, theme_skin_id,
           font_skin_id, animation_skin_id, total_time, total_exp, gold_coin, level, status, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  if (!user) return fail(res, 404, '用户不存在');

  const levelInfo = calcLevel(user.total_exp || 0);
  const avatar = db.prepare('SELECT * FROM items WHERE id = ?').get(user.avatar_id || 1);
  const frame = db.prepare('SELECT * FROM items WHERE id = ?').get(user.frame_id || 1);
  const focusCount = db.prepare('SELECT COUNT(*) as cnt FROM timer_records WHERE user_id = ?').get(user.id).cnt;
  const achievementCount = db.prepare('SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ?').get(user.id).cnt;

  return success(res, {
    id: String(user.id), uid: user.uid, nickname: user.nickname,
    email: user.email, phone: user.phone,
    level: levelInfo.level,
    exp: Math.round(levelInfo.currentExp * 100) / 100,
    maxExp: Math.round(levelInfo.maxExp * 100) / 100,
    total_time: user.total_time || 0, gold_coin: user.gold_coin || 0,
    avatar_id: user.avatar_id, frame_id: user.frame_id,
    theme_skin_id: user.theme_skin_id, font_skin_id: user.font_skin_id, animation_skin_id: user.animation_skin_id,
    avatar_item: avatar, frame_item: frame,
    focus_count: focusCount, achievement_count: achievementCount,
    created_at: user.created_at,
  });
});

/**
 * PUT /api/user/profile
 */
router.put('/profile', (req, res) => {
  const allowed = ['nickname', 'avatar_id', 'frame_id', 'theme_skin_id', 'font_skin_id', 'animation_skin_id'];
  const fields = allowed.filter(k => req.body[k] !== undefined);
  if (fields.length === 0) return fail(res, 400, '没有可更新的字段');

  const db = getDB();

  // 验证装扮归属
  const itemFieldsToCheck = {
    avatar_id: 'avatar', frame_id: 'frame', theme_skin_id: 'theme',
    font_skin_id: 'font', animation_skin_id: 'animation',
  };
  for (const [field, itemType] of Object.entries(itemFieldsToCheck)) {
    if (req.body[field] !== undefined) {
      const item = db.prepare('SELECT * FROM items WHERE id = ? AND type = ?').get(req.body[field], itemType);
      if (!item) return fail(res, 400, `无效的 ${itemType} ID`);
      const owned = db.prepare('SELECT id FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, req.body[field]);
      if (!owned && !item.is_default) return fail(res, 403, `未拥有该 ${itemType}`);
    }
  }

  const setSQL = fields.map(k => `${k} = ?`).join(', ');
  const values = fields.map(k => req.body[k]);
  values.push(req.user.id);

  db.prepare(`UPDATE users SET ${setSQL} WHERE id = ?`).run(...values);
  return success(res, null, '更新成功');
});

/**
 * GET /api/user/inventory
 */
router.get('/inventory', (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT i.id, i.type, i.name, i.description, i.price_gold, i.icon_url, i.is_default, ui.acquired_at
    FROM user_items ui JOIN items i ON i.id = ui.item_id
    WHERE ui.user_id = ? ORDER BY i.type, ui.acquired_at
  `).all(req.user.id);

  const grouped = {};
  for (const item of items) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  }
  return success(res, { items, grouped });
});

/**
 * GET /api/user/achievements
 */
router.get('/achievements', (req, res) => {
  const db = getDB();
  const list = db.prepare(`
    SELECT a.id, a.key, a.name, a.description, a.icon_url, a.condition_type, a.condition_value, ua.unlocked_at
    FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ? ORDER BY ua.unlocked_at DESC
  `).all(req.user.id);
  return success(res, list);
});

module.exports = router;
