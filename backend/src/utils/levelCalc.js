/**
 * 升级经验公式：ExpToNextLevel(n) = 2×n³ + 5×n² + 20×n + 50
 * n 为目标等级
 * 返回从 1 级升到指定等级所需的累计总经验
 */
function cumulativeExpForLevel(targetLevel) {
  let total = 0;
  for (let lv = 2; lv <= targetLevel; lv++) {
    total += expToNext(lv);
  }
  return total;
}

/**
 * 从当前等级升到 (currentLevel + 1) 所需的经验值
 */
function expToNext(level) {
  return 2 * Math.pow(level, 3) + 5 * Math.pow(level, 2) + 20 * level + 50;
}

/**
 * 根据总经验值计算当前等级和升级进度
 * @param {number} totalExp - 用户当前总经验
 * @returns {{ level: number, currentExp: number, maxExp: number }}
 */
function calcLevel(totalExp) {
  let level = 1;
  let remaining = totalExp;

  while (true) {
    const needed = expToNext(level + 1);
    if (remaining >= needed) {
      remaining -= needed;
      level++;
    } else {
      break;
    }
  }

  return {
    level,
    currentExp: remaining,
    maxExp: expToNext(level + 1),
  };
}

/**
 * 根据持续秒数计算经验和金币（不含活动加成）
 * @param {number} durationSeconds - 专注秒数
 * @returns {{ exp: number, coin: number }}
 */
function calcRewards(durationSeconds) {
  // 基础经验：每分钟 1 点（每秒 1/60 点）
  const exp = durationSeconds / 60;
  // 基础金币：每秒 0.0001
  const coin = durationSeconds * 0.0001;
  return { exp, coin };
}

module.exports = { cumulativeExpForLevel, expToNext, calcLevel, calcRewards };
