# 卷了么 (JuǎnLeMe) - 专注计时 App

🥬 **你的时间，终将伟大。**

## 项目结构

```
juanleme/
├── backend/                 # 后端 API 服务
│   ├── src/
│   │   ├── config/          # 数据库、JWT 配置
│   │   ├── middleware/      # 认证、限流中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑服务
│   │   ├── utils/           # 工具函数
│   │   └── index.js         # 入口文件
│   ├── package.json
│   └── juanleme.db          # SQLite 数据库（自动生成）
│
├── client/                  # 前端 React App
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── components/      # UI 组件
│   │   ├── types/           # TypeScript 类型
│   │   ├── App.tsx          # 主应用组件
│   │   └── main.tsx         # 入口
│   ├── package.json
│   └── vite.config.ts
│
├── start.bat                # Windows 启动脚本
├── start.sh                 # macOS/Linux 启动脚本
└── README.md
```

## 快速启动

### 方式一：一键启动

**Windows:** 双击 `start.bat`
**macOS/Linux:** 终端运行 `bash start.sh`

### 方式二：手动启动

**1. 安装后端依赖并启动：**
```bash
cd backend
npm install
node src/index.js
```

**2. 安装前端依赖并启动：**
```bash
cd client
npm install
npx vite
```

## 访问地址

- **前端 App:** http://localhost:5173
- **后端 API:** http://localhost:3001
- **健康检查:** http://localhost:3001/api/health

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (Access + Refresh Token) |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS |
| 动画 | Motion |

## API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 密码登录 |
| POST | /api/auth/send-code | 发送验证码 |
| POST | /api/auth/demo-login | 体验账号登录 |
| GET | /api/user/profile | 用户信息 |
| PUT | /api/user/profile | 更新用户信息 |
| POST | /api/timer/submit | 提交计时 |
| GET | /api/timer/stats | 计时统计 |
| GET | /api/shop/items | 商城物品 |
| POST | /api/shop/buy | 购买物品 |
| POST | /api/shop/equip | 佩戴物品 |
| GET | /api/leaderboard | 排行榜 |
| POST | /api/friends/request | 发送好友请求 |
| GET | /api/notifications | 通知列表 |

## 数据库设计

基于 `design.md` 的设计文档，使用 SQLite 实现了以下表：
- users, user_auths, timer_records, achievements, user_achievements
- items, user_items, friendships, notifications
- activities, user_activities, feedbacks

## 等级计算

升级经验公式：`ExpToNextLevel(n) = 2n³ + 5n² + 20n + 50`
