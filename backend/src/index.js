const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./config/database');
const { seedAchievements, seedItems } = require('./utils/seedData');
const { generalLimiter } = require('./middleware/rateLimiter');
const { success } = require('./utils/response');

// ===== 初始化数据库和种子数据 =====
const db = initDB();
seedAchievements(db);
seedItems(db);

// ===== 创建 Express 应用 =====
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ===== CORS =====
if (isProd) {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    credentials: true,
  }));
}
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// ===== 生产环境：serve 前端构建产物 =====
if (isProd) {
  const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(distPath));
}

// ===== API 路由 =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/timer', require('./routes/timer'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/feedback', require('./routes/feedback'));

// ===== 健康检查 =====
app.get('/api/health', (req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ===== SPA fallback（生产环境） =====
if (isProd) {
  const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ===== 404（仅非生产环境） =====
if (!isProd) {
  app.use((req, res) => {
    res.status(404).json({ code: 404, message: '接口不存在' });
  });
}

// ===== 全局错误处理 =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ===== 启动服务器 =====
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════╗
║       卷了么 API Server          ║
║  Running on http://0.0.0.0:${PORT}  ║
╚══════════════════════════════════╝
  `);
});
