const express = require('express');
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/shop/items
 */
router.get('/items', (req, res) => {
  const db = getDB();
  const type = req.query.type;
  let items;

  if (type) {
    items = db.prepare('SELECT * FROM items WHERE type = ? ORDER BY price_gold ASC').all(type);
  } else {
    items = db.prepare('SELECT * FROM items ORDER BY type, price_gold ASC').all();
  }

  const ownedItems = db.prepare('SELECT item_id FROM user_items WHERE user_id = ?').all(req.user.id);
  const ownedSet = new Set(ownedItems.map(o => o.item_id));

  const result = items.map(item => ({ ...item, owned: ownedSet.has(item.id), purchasable: item.price_gold > 0 }));

  const grouped = {};
  for (const item of result) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  }

  return success(res, { items: result, grouped });
});

/**
 * POST /api/shop/buy
 */
router.post('/buy', (req, res) => {
  const { item_id } = req.body;
  if (!item_id) return fail(res, 400, '缺少物品 ID');

  const db = getDB();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
  if (!item) return fail(res, 404, '物品不存在');
  if (item.price_gold <= 0) return fail(res, 400, '该物品不可购买');

  const owned = db.prepare('SELECT id FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, item_id);
  if (owned) return fail(res, 400, '该物品已拥有');

  const user = db.prepare('SELECT gold_coin FROM users WHERE id = ?').get(req.user.id);
  if (!user || user.gold_coin < item.price_gold) return fail(res, 400, '金币不足');

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE users SET gold_coin = gold_coin - ? WHERE id = ?').run(item.price_gold, req.user.id);
    db.prepare('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)').run(req.user.id, item_id);
    db.prepare('INSERT INTO notifications (user_id, type, title, content) VALUES (?, \'system\', \'购买成功\', ?)')
      .run(req.user.id, `成功购买了「${item.name}」`);
    db.exec('COMMIT');
    return success(res, { item, remaining_coin: user.gold_coin - item.price_gold }, '购买成功');
  } catch (err) {
    db.exec('ROLLBACK');
    return fail(res, 500, '购买失败');
  }
});

/**
 * POST /api/shop/equip
 */
router.post('/equip', (req, res) => {
  const { item_id } = req.body;
  if (!item_id) return fail(res, 400, '缺少物品 ID');

  const db = getDB();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
  if (!item) return fail(res, 404, '物品不存在');

  const owned = db.prepare('SELECT id FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, item_id);
  if (!owned && !item.is_default) return fail(res, 403, '未拥有该物品');

  const fieldMap = { avatar: 'avatar_id', frame: 'frame_id', theme: 'theme_skin_id', font: 'font_skin_id', animation: 'animation_skin_id' };
  const field = fieldMap[item.type];
  if (!field) return fail(res, 400, '无效的物品类型');

  db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`).run(item_id, req.user.id);
  return success(res, { type: item.type, item_id }, '佩戴成功');
});

module.exports = router;
