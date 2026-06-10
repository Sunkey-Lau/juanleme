const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/notifications
 * 获取通知列表（分页）
 */
router.get('/', (req, res) => {
  const db = getDB();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?').get(req.user.id).cnt;
  const list = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);

  return success(res, {
    data: list,
    total,
    page,
    total_pages: Math.ceil(total / limit),
  });
});

/**
 * GET /api/notifications/unread-count
 * 获取未读通知数量
 */
router.get('/unread-count', (req, res) => {
  const db = getDB();
  const count = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
  return success(res, { unread_count: count.cnt });
});

/**
 * PUT /api/notifications/read
 * 标记通知为已读
 * Body: { ids?: number[] } — 不传则标记全部已读
 */
router.put('/read', (req, res) => {
  const db = getDB();
  const { ids } = req.body;

  if (ids && Array.isArray(ids)) {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`).run(...ids, req.user.id);
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  }

  return success(res, null, '已标为已读');
});

module.exports = router;
