const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/friends
 * 获取好友列表
 * Query: status (pending/accepted/rejected, 默认 accepted)
 */
router.get('/', (req, res) => {
  const db = getDB();
  const status = req.query.status || 'accepted';

  // 用户发起的好友请求 + 收到的好友请求（双向）
  const sent = db.prepare(`
    SELECT f.id, f.status, f.created_at,
           u.id as friend_id, u.uid, u.nickname, u.avatar_id, u.level, u.total_time, u.total_exp
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ? AND f.status = ?
  `).all(req.user.id, status);

  const received = db.prepare(`
    SELECT f.id, f.status, f.created_at,
           u.id as friend_id, u.uid, u.nickname, u.avatar_id, u.level, u.total_time, u.total_exp
    FROM friendships f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = ? AND f.status = ?
  `).all(req.user.id, status);

  const friends = [...sent, ...received].map(f => ({
    friendship_id: f.id,
    friend_id: String(f.friend_id),
    uid: f.uid,
    nickname: f.nickname,
    avatar_id: f.avatar_id,
    level: f.level,
    total_time: f.total_time,
    status: f.status,
    created_at: f.created_at,
  }));

  return success(res, friends);
});

/**
 * POST /api/friends/request
 * 发送好友请求
 * Body: { friend_uid }
 */
router.post('/request', (req, res) => {
  const { friend_uid } = req.body;
  if (!friend_uid) return fail(res, 400, '缺少好友 UID');

  const db = getDB();
  const friend = db.prepare('SELECT id, nickname FROM users WHERE uid = ?').get(friend_uid);
  if (!friend) return fail(res, 404, '用户不存在');
  if (friend.id === req.user.id) return fail(res, 400, '不能添加自己为好友');

  // 检查是否已有关系
  const existing = db.prepare(`
    SELECT id, status FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `).get(req.user.id, friend.id, friend.id, req.user.id);

  if (existing) {
    if (existing.status === 'accepted') return fail(res, 400, '已是好友');
    if (existing.status === 'pending') return fail(res, 400, '已发送过好友请求');
    // rejected -> 可以重新发送
    db.prepare('DELETE FROM friendships WHERE id = ?').run(existing.id);
  }

  // 发送请求
  db.prepare(`
    INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending')
  `).run(req.user.id, friend.id);

  // 通知对方
  const myUser = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (?, 'friend', '好友请求', ?, ?)
  `).run(friend.id, `${myUser.nickname} 请求添加你为好友`, req.user.id);

  return success(res, null, '好友请求已发送');
});

/**
 * POST /api/friends/respond
 * 回应好友请求
 * Body: { friendship_id, action: 'accept' | 'reject' }
 */
router.post('/respond', (req, res) => {
  const { friendship_id, action } = req.body;
  if (!friendship_id || !action) return fail(res, 400, '参数不完整');
  if (!['accept', 'reject'].includes(action)) return fail(res, 400, '无效的操作');

  const db = getDB();
  const friendship = db.prepare('SELECT * FROM friendships WHERE id = ?').get(friendship_id);
  if (!friendship) return fail(res, 404, '好友请求不存在');
  if (friendship.friend_id !== req.user.id) return fail(res, 403, '无权操作');

  const newStatus = action === 'accept' ? 'accepted' : 'rejected';
  db.prepare('UPDATE friendships SET status = ? WHERE id = ?').run(newStatus, friendship_id);

  if (action === 'accept') {
    // 通知对方
    const myUser = db.prepare('SELECT nickname FROM users WHERE id = ?').get(req.user.id);
    const friendUser = db.prepare('SELECT nickname FROM users WHERE id = ?').get(friendship.user_id);
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (?, 'friend', '好友请求已通过', ?, ?)
    `).run(friendship.user_id, `你和 ${myUser.nickname} 已成为好友`, req.user.id);
  }

  return success(res, { status: newStatus }, action === 'accept' ? '已接受好友请求' : '已拒绝好友请求');
});

/**
 * DELETE /api/friends/:id
 * 删除好友
 */
router.delete('/:id', (req, res) => {
  const db = getDB();
  const friendship = db.prepare(`
    SELECT id FROM friendships
    WHERE id = ? AND (user_id = ? OR friend_id = ?)
  `).get(req.params.id, req.user.id, req.user.id);

  if (!friendship) return fail(res, 404, '好友关系不存在');
  db.prepare('DELETE FROM friendships WHERE id = ?').run(friendship.id);

  return success(res, null, '已删除好友');
});

module.exports = router;
