const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { calcLevel } = require('../utils/levelCalc');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/leaderboard
 * 获取排行榜
 * Query: type (total_time / level / achievement), limit, page
 */
router.get('/', (req, res) => {
  const db = getDB();
  const type = req.query.type || 'total_time';
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

  let users;
  switch (type) {
    case 'total_time':
      users = db.prepare(`
        SELECT id, uid, nickname, avatar_id, total_time, level
        FROM users WHERE status = 0
        ORDER BY total_time DESC
      `).all();
      break;

    case 'level':
      users = db.prepare(`
        SELECT id, uid, nickname, avatar_id, total_time, level, total_exp
        FROM users WHERE status = 0
        ORDER BY level DESC, total_exp DESC
      `).all();
      break;

    case 'achievement':
      users = db.prepare(`
        SELECT u.id, u.uid, u.nickname, u.avatar_id, u.total_time, u.level,
               (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievement_count
        FROM users u WHERE u.status = 0
        ORDER BY achievement_count DESC
      `).all();
      break;

    default:
      return fail(res, 400, '无效的排行榜类型');
  }

  // 构建排名数据
  const list = users.map((u, idx) => ({
    rank: idx + 1,
    uid: u.uid,
    nickname: u.nickname,
    avatar_id: u.avatar_id,
    level: u.level,
    score: type === 'total_time' ? (u.total_time || 0) :
           type === 'level' ? (u.total_exp || 0) :
           type === 'achievement' ? (u.achievement_count || 0) : 0,
  }));

  // 查找当前用户排名
  let myRank = null;
  const myUid = req.user.uid;

  for (let i = 0; i < list.length; i++) {
    if (list[i].uid === myUid) {
      myRank = { rank: i + 1, ...list[i] };
      break;
    }
  }

  // 如果前100名中没有，单独查询排名
  if (!myRank) {
    let rank;
    switch (type) {
      case 'total_time':
        rank = db.prepare(`
          SELECT COUNT(*) + 1 as rank FROM users
          WHERE status = 0 AND total_time > (SELECT total_time FROM users WHERE uid = ?)
        `).get(myUid).rank;
        break;
      case 'level':
        rank = db.prepare(`
          SELECT COUNT(*) + 1 as rank FROM users
          WHERE status = 0 AND (level > (SELECT level FROM users WHERE uid = ?) OR (level = (SELECT level FROM users WHERE uid = ?) AND total_exp > (SELECT total_exp FROM users WHERE uid = ?)))
        `).get(myUid, myUid, myUid).rank;
        break;
    }
    const myUser = db.prepare('SELECT * FROM users WHERE uid = ?').get(myUid);
    myRank = {
      rank: rank || 'N/A',
      uid: myUid,
      nickname: myUser?.nickname || '',
      avatar_id: myUser?.avatar_id || 1,
      level: myUser?.level || 1,
      score: type === 'total_time' ? (myUser?.total_time || 0) : (myUser?.total_exp || 0),
    };
  }

  return success(res, {
    type,
    list,
    my_rank: myRank,
  });
});

module.exports = router;
