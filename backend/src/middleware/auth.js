const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const { fail } = require('../utils/response');

/**
 * 验证 JWT Access Token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, '未授权，缺少 Token');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, uid, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 401, 'Token 已过期，请刷新');
    }
    return fail(res, 401, '无效的 Token');
  }
}

module.exports = { authMiddleware };
