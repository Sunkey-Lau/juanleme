const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * POST /api/feedback
 * 提交反馈
 * Body: { content, images? (JSON string array) }
 */
router.post('/', (req, res) => {
  const { content, images } = req.body;
  if (!content || !content.trim()) return fail(res, 400, '反馈内容不能为空');

  const db = getDB();
  db.prepare(`
    INSERT INTO feedbacks (user_id, content, images)
    VALUES (?, ?, ?)
  `).run(req.user.id, content, images || JSON.stringify([]));

  return success(res, null, '反馈已提交，感谢您的意见！');
});

/**
 * GET /api/feedback
 * 获取用户的反馈历史
 */
router.get('/', (req, res) => {
  const db = getDB();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as cnt FROM feedbacks WHERE user_id = ?').get(req.user.id).cnt;
  const list = db.prepare(`
    SELECT * FROM feedbacks WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);

  return success(res, { data: list, total, page, total_pages: Math.ceil(total / limit) });
});

module.exports = router;
