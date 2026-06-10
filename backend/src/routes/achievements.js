const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/achievements
 * 获取所有成就定义及用户解锁状态
 */
router.get('/', (req, res) => {
  const db = getDB();
  const all = db.prepare('SELECT * FROM achievements ORDER BY id').all();
  const unlocked = db.prepare('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?').all(req.user.id);
  const unlockedMap = {};
  for (const u of unlocked) {
    unlockedMap[u.achievement_id] = u.unlocked_at;
  }

  const result = all.map(a => ({
    ...a,
    unlocked: !!unlockedMap[a.id],
    unlocked_at: unlockedMap[a.id] || null,
  }));

  return success(res, result);
});

// /**
//  * GET /api/achievements/user
//  * 获取用户解锁的成就（也可以从 /api/user/achievements 获得）
//  */
// 已包含在 user 路由中

module.exports = router;
