/**
 * 成就检查服务
 * 每次计时提交后调用，检查是否解锁新成就
 */
const { getDB } = require('../config/database');

/**
 * 检查并解锁新成就
 * @param {number} userId - 用户 ID
 * @param {object} userData - 用户最新数据快照
 * @returns {Array} 新解锁的成就列表
 */
function checkAchievements(userId, userData) {
  const db = getDB();
  const { total_time, total_exp, gold_coin, level } = userData;

  const owned = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?')
    .all(userId)
    .map(r => r.achievement_id);

  const allAchievements = db.prepare('SELECT * FROM achievements').all();

  const focusCount = db.prepare('SELECT COUNT(*) as cnt FROM timer_records WHERE user_id = ?')
    .get(userId).cnt;

  const friendCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM friendships
    WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
  `).get(userId, userId).cnt;

  const newlyUnlocked = [];

  for (const ach of allAchievements) {
    if (owned.includes(ach.id)) continue;
    let satisfied = false;

    switch (ach.condition_type) {
      case 'focus_count':
        satisfied = focusCount >= ach.condition_value;
        break;
      case 'total_time':
        satisfied = total_time >= ach.condition_value;
        break;
      case 'level':
        satisfied = level >= ach.condition_value;
        break;
      case 'total_coin':
        satisfied = gold_coin >= ach.condition_value;
        break;
      case 'friend_count':
        satisfied = friendCount >= ach.condition_value;
        break;
      case 'streak_days':
        satisfied = total_time >= ach.condition_value * 600;
        break;
    }

    if (satisfied) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, datetime(\'now\'))')
        .run(userId, ach.id);
      db.prepare('INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, \'achievement\', ?, ?, ?)')
        .run(userId, `解锁成就：${ach.name}`, ach.description || '', ach.id);
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
}

module.exports = { checkAchievements };
