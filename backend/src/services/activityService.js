const { getDB } = require('../config/database');

/**
 * 活动进度更新服务
 * 每次计时提交后调用
 */
function updateActivityProgress(userId, durationSeconds, expEarned, coinEarned) {
  const db = getDB();

  const userActs = db.prepare(`
    SELECT ua.*, a.task_config, a.type
    FROM user_activities ua
    JOIN activities a ON a.id = ua.activity_id
    WHERE ua.user_id = ? AND ua.status = 'in_progress'
  `).all(userId);

  const updated = [];

  for (const ua of userActs) {
    let config;
    try {
      config = JSON.parse(ua.task_config);
    } catch {
      continue;
    }

    for (const task of config) {
      const progressAdd =
        task.type === 'duration' ? Math.floor(durationSeconds) :
        task.type === 'exp' ? Math.floor(expEarned) :
        task.type === 'coin' ? Math.floor(coinEarned) :
        task.type === 'count' ? 1 : 0;

      if (progressAdd > 0) {
        db.prepare(`
          UPDATE user_activities
          SET progress = progress + ?
          WHERE user_id = ? AND activity_id = ? AND task_id = ?
        `).run(progressAdd, userId, ua.activity_id, task.id);

        updated.push({ activity_id: ua.activity_id, task_id: task.id, added: progressAdd });
      }
    }
  }

  return updated;
}

module.exports = { updateActivityProgress };
