/**
 * 统一响应格式
 */
function success(res, data = null, message = 'success') {
  return res.json({ code: 200, message, data });
}

function fail(res, code = 400, message = '参数错误', data = null) {
  return res.status(code >= 100 && code < 600 ? code : 400).json({ code, message, data });
}

function paginated(res, { data, total, page, limit }) {
  const total_pages = Math.ceil(total / limit);
  return res.json({
    code: 200,
    message: 'success',
    data,
    total,
    page,
    total_pages,
  });
}

module.exports = { success, fail, paginated };
