/**
 * 种子数据：初始化成就定义和默认装扮物品
 * 运行方式: node src/utils/seedData.js
 */
const { getDB, initDB } = require('../config/database');

function seedAchievements(db) {
  const achievements = [
    { key: 'first_focus', name: '初次专注', description: '完成第一次专注计时', condition_type: 'focus_count', condition_value: 1 },
    { key: 'focus_10', name: '坚持达人', description: '累计完成 10 次专注', condition_type: 'focus_count', condition_value: 10 },
    { key: 'focus_100', name: '专注大师', description: '累计完成 100 次专注', condition_type: 'focus_count', condition_value: 100 },
    { key: 'time_1h', name: '一小时', description: '累计专注 1 小时', condition_type: 'total_time', condition_value: 3600 },
    { key: 'time_10h', name: '十小时', description: '累计专注 10 小时', condition_type: 'total_time', condition_value: 36000 },
    { key: 'time_100h', name: '百时侠', description: '累计专注 100 小时', condition_type: 'total_time', condition_value: 360000 },
    { key: 'lv_5', name: '等级初升', description: '达到 5 级', condition_type: 'level', condition_value: 5 },
    { key: 'lv_10', name: '小有成就', description: '达到 10 级', condition_type: 'level', condition_value: 10 },
    { key: 'lv_20', name: '登堂入室', description: '达到 20 级', condition_type: 'level', condition_value: 20 },
    { key: 'lv_50', name: '卷王之王', description: '达到 50 级', condition_type: 'level', condition_value: 50 },
    { key: 'coin_100', name: '初次积蓄', description: '累计获得 100 金币', condition_type: 'total_coin', condition_value: 100 },
    { key: 'coin_1000', name: '千金散尽', description: '累计获得 1000 金币', condition_type: 'total_coin', condition_value: 1000 },
    { key: 'streak_7', name: '七日连卷', description: '连续 7 天有专注记录', condition_type: 'streak_days', condition_value: 7 },
    { key: 'friend_1', name: '社交达人', description: '拥有第一个好友', condition_type: 'friend_count', condition_value: 1 },
    { key: 'friend_10', name: '好友成群', description: '拥有 10 个好友', condition_type: 'friend_count', condition_value: 10 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO achievements (key, name, description, icon_url, condition_type, condition_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const a of achievements) {
    insert.run(a.key, a.name, a.description, null, a.condition_type, a.condition_value);
  }
  console.log(`Seeded ${achievements.length} achievements.`);
}

function seedItems(db) {
  const items = [
    { type: 'avatar', name: '默认卷心菜', description: '一颗绿色的卷心菜头像', price_gold: 0, is_default: 1 },
    { type: 'avatar', name: '微笑太阳', description: '温暖微笑的太阳', price_gold: 500, is_default: 0 },
    { type: 'avatar', name: '月亮猫', description: '月亮下的小猫', price_gold: 1200, is_default: 0 },
    { type: 'avatar', name: '忍者卷心菜', description: '忍者装扮的卷心菜', price_gold: 2000, is_default: 0 },
    { type: 'avatar', name: '黄金卷心菜', description: '闪闪发光的黄金卷心菜', price_gold: 5000, is_default: 0 },
    { type: 'frame', name: '默认边框', description: '简约透明边框', price_gold: 0, is_default: 1 },
    { type: 'frame', name: '火焰边框', description: '燃烧的火焰特效边框', price_gold: 800, is_default: 0 },
    { type: 'frame', name: '星空边框', description: '闪烁的星空边框', price_gold: 1500, is_default: 0 },
    { type: 'frame', name: '钻石边框', description: '镶钻豪华边框', price_gold: 3000, is_default: 0 },
    { type: 'theme', name: '默认深紫', description: '经典的深紫色主题', price_gold: 0, is_default: 1 },
    { type: 'theme', name: '深海蓝', description: '深邃海洋蓝色主题', price_gold: 600, is_default: 0 },
    { type: 'theme', name: '樱花粉', description: '浪漫樱花粉色主题', price_gold: 600, is_default: 0 },
    { type: 'theme', name: '森林绿', description: '清新森林绿色主题', price_gold: 600, is_default: 0 },
    { type: 'theme', name: '暗夜黑金', description: '低调奢华黑金主题', price_gold: 1500, is_default: 0 },
    { type: 'theme', name: '赛博朋克', description: '霓虹赛博朋克主题', price_gold: 2500, is_default: 0 },
    { type: 'font', name: '经典白', description: '经典白色数字字体', price_gold: 0, is_default: 1 },
    { type: 'font', name: '霓虹蓝', description: '霓虹蓝色发光字体', price_gold: 300, is_default: 0 },
    { type: 'font', name: '火焰红', description: '火焰红色动感字体', price_gold: 300, is_default: 0 },
    { type: 'font', name: '彩虹', description: '七彩渐变字体', price_gold: 800, is_default: 0 },
    { type: 'animation', name: '默认卷心菜', description: '默认卷心菜咀嚼动画', price_gold: 0, is_default: 1 },
    { type: 'animation', name: '萌猫', description: '可爱小猫陪伴动画', price_gold: 1000, is_default: 0 },
    { type: 'animation', name: '小树苗', description: '生长中的小树苗动画', price_gold: 1000, is_default: 0 },
    { type: 'animation', name: '星辰旋转', description: '旋转星辰特效动画', price_gold: 2000, is_default: 0 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO items (type, name, description, price_gold, is_default)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insert.run(item.type, item.name, item.description, item.price_gold, item.is_default);
  }
  console.log(`Seeded ${items.length} items.`);
}

if (require.main === module) {
  const db = initDB();
  seedAchievements(db);
  seedItems(db);
  console.log('Seed completed.');
  process.exit(0);
}

module.exports = { seedAchievements, seedItems };
