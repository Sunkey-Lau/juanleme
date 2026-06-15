const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./config/database');
const { seedAchievements, seedItems } = require('./utils/seedData');
const { generalLimiter } = require('./middleware/rateLimiter');
const { success } = require('./utils/response');

const db = initDB();
seedAchievements(db);
seedItems(db);

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// SPA fallback（放在 API 路由之后，所有非 /api 的 GET 返回 index.html）
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

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

app.get('/api/health', (req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`卷了么 API Server running on port ${PORT}`);
});
