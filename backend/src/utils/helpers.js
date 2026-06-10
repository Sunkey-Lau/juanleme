/**
 * 工具函数：生成 UID、时间等
 */
const crypto = require('crypto');

/** 生成 12 位数字 UID */
function generateUID() {
  const ts = Date.now().toString(36).slice(-4);
  const rand = crypto.randomInt(10000000, 99999999);
  return `${ts}${rand}`.slice(0, 12);
}

/** 生成验证码 (6位数字) */
function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

/** 当前时间字符串 */
function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

module.exports = { generateUID, generateCode, now };
