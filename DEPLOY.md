# 卷了么 · 云端部署方案

> 目标：让全世界的人都能通过网址访问你的应用

---

## 方案一：Railway.app 一键部署（推荐）

**最省心方案，从零到上线约 10 分钟，免费额度够用**

### 步骤

**1. 注册 Railway**
访问 https://railway.app ，用 GitHub 账号登录

**2. 上传项目到 GitHub**
```bash
cd juanleme
git init
git add .
git commit -m "init"
# 在 GitHub 新建仓库，然后：
git remote add origin https://github.com/你的用户名/juanleme.git
git push -u origin main
```

**3. 在 Railway 新建项目**
- 点击 `New Project` → `Deploy from GitHub repo`
- 选择 `juanleme` 仓库
- Railway 会自动检测 `package.json` 并部署

**4. 设置环境变量**
在 Railway 项目设置中添加：
```
NODE_ENV=production
JWT_SECRET=你的随机密钥（可用 openssl rand -hex 32 生成）
PORT=3001
```

**5. 绑定域名**
- Railway 会自动生成 `*.railway.app` 域名
- 也可以在设置中添加自定义域名

**6. 构建前端**
在项目根目录创建 `railway.json`（Railway 会自动读取）：
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd client && npm install && npx vite build && cd ../backend && npm install && node src/index.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**完成后访问 Railway 分配的域名即可！**

---

## 方案二：阿里云 / 腾讯云 ECS 部署

> 适合已有云服务器，完全可控

### 步骤

**1. 购买云服务器**
- 阿里云 ECS 或 腾讯云 CVM，最低配 `2核2G` 即可
- 系统选 **Ubuntu 22.04**
- 安全组开放端口：`80`、`443`、`3001`

**2. 登录服务器**
```bash
ssh root@你的服务器IP
```

**3. 安装环境**
```bash
# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Nginx
apt-get install -y nginx

# 验证
node -v   # 应显示 v22.x
```

**4. 上传项目**
```bash
# 本地打包
cd juanleme
tar -czf juanleme.tar.gz .

# 上传到服务器
scp juanleme.tar.gz root@你的服务器IP:/root/
```

**5. 服务器上部署**
```bash
cd /root
tar -xzf juanleme.tar.gz
cd juanleme

# 安装后端依赖
cd backend && npm install && cd ..

# 构建前端
cd client && npm install && npx vite build && cd ..

# 测试启动后端
node backend/src/index.js
# 看到 "卷了么 API Server" 说明成功，Ctrl+C 停止
```

**6. 配置守护进程（PM2）**
```bash
npm install -g pm2

# 创建启动配置文件 juanleme/ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'juanleme-api',
    script: 'backend/src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      JWT_SECRET: '你的随机密钥',
    },
  }],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 开机自启
```

**7. 配置 Nginx 反向代理**

```nginx
# /etc/nginx/sites-available/juanleme
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    root /root/juanleme/client/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA 路由（所有非文件请求返回 index.html）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/juanleme /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**8. 配置 HTTPS（免费证书）**
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名
```

**完成！** 访问 `https://你的域名` 即可。

---

## 方案三：Render.com 免费部署

> 比 Railway 慢一点，但有永久免费额度

**步骤：**

1. 注册 https://render.com
2. 点击 `New +` → `Web Service`
3. 连接 GitHub 仓库
4. 填写配置：
   - **Name**: `juanleme-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. 添加环境变量：
   - `NODE_ENV=production`
   - `JWT_SECRET=你的密钥`
6. 部署后拿到 `https://juanleme-api.onrender.com`
7. 再用 `Static Site` 部署前端：
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - 在 `Redirect` 规则中加一条：`/* → /index.html`（SPA 路由）

---

## 三、数据库选择说明

### 当前状态
项目使用 **SQLite**（本地文件），部署后也完全可用。

### SQLite 用在哪些场景？
| 场景 | 是否推荐 |
|------|---------|
| ✅ 个人 / 小团队使用（< 1000 用户） | 完全没问题 |
| ✅ Railway / Render 单实例部署 | 完全没问题 |
| ❌ 多实例负载均衡 | 不推荐，SQLite 不支持并发写 |
| ❌ 需要数据备份恢复 | 可以但比较麻烦 |

### 如果需要换 PostgreSQL
当用户量大需要多实例时，把 `backend/src/config/database.js` 替换为同目录下的 `database-pg.js`，然后所有路由中的 `db.prepare(...).get/all/run` 改为 `await client.query()`。

---

## 四、一键部署脚本

```bash
# deploy.sh - 在服务器上运行
set -e

echo "=== 卷了么 部署脚本 ==="

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
cd backend && npm install && cd ..
cd client && npm install && cd ..

# 3. 构建前端
cd client && npx vite build && cd ..

# 4. 重启后端
pm2 restart juanleme-api

echo "=== 部署完成 ==="
```

---

## 五、环境变量清单

| 变量名 | 说明 | 本地开发值 | 生产值 |
|--------|------|-----------|--------|
| `PORT` | 服务端口 | `3001` | `3001` |
| `NODE_ENV` | 运行环境 | `development` | `production` |
| `JWT_SECRET` | JWT 签名密钥 | `juanleme_jwt_secret_key_2026` | `随机长字符串` |
| `DATABASE_URL` | 数据库连接 | 不设置（用 SQLite） | PostgreSQL 连接串 |

---

## 六、CORS 配置调整

部署后需要修改 `backend/src/index.js` 中的 CORS 域名：

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://你的前端域名.com',    // ← 加上你的线上域名
    'https://juanleme-api.onrender.com',  // ← 或 Railway/Render 域名
  ],
  credentials: true,
}));
```

---

## 总结：最快上线的路径

```
Railway.app（10分钟）
  ├── GitHub 推送代码
  ├── Railway 自动部署后端
  ├── 自动生成 https://xxx.railway.app
  └── 搞定
```

**不需要** 买服务器、配 Nginx、申请证书、管理数据库。适合个人项目和小型应用。
