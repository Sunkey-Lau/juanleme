# 卷了么 · Railway 一键部署操作步骤

本文档带你用 Railway.app 将应用部署到云端，**让任何人都能通过网址访问**。

---

## ⏱ 总耗时：10 分钟

```
① GitHub 建仓库（2 分钟）
② 推送代码（2 分钟）
③ Railway 部署（5 分钟）
④ 配置完成（1 分钟）
```

---

## 第一步：在 GitHub 新建仓库

> 如果你没有 GitHub 账号，先注册 https://github.com/signup

1. 打开浏览器访问 https://github.com/new

2. 填写以下信息：
   - **Repository name**：`juanleme`（或者任意名字）
   - **Description**：留空
   - **Public / Private**：选 **Public**（免费方案需要）
   - **不要勾选** "Add a README"、"Add .gitignore"、"Choose a license"

3. 点击 **Create repository**

4. 创建完成后会跳转到一个页面，**保持这个页面不要关**，下面会用。

---

## 第二步：初始化本地 git 并推送代码

1. **打开终端（CMD）**，进入到项目目录：

```bash
cd /d "C:\Users\LIUCJ\AppData\Local\Claude-3p\local-agent-mode-sessions\a4b8d586\00000000\local_2a5410ea-500d-4f8f-b270-185de2d8f053\outputs\juanleme"
```

2. **初始化 git 仓库：**

```bash
git init
git add .
git commit -m "first commit"
```

3. **配置 Git 用户名和邮箱（如果还没配过）：**

```bash
git config --global user.email "你的邮箱@example.com"
git config --global user.name "你的用户名"
```

4. **关联远程仓库并推送：**

```bash
git remote add origin https://github.com/你的GitHub用户名/juanleme.git
git branch -M main
git push -u origin main
```

> ⚠️ 注意：第 4 步的仓库地址不要照抄，去 GitHub 页面复制你的仓库地址。
> 在第 1 步创建的仓库页面里，会有这样一行字：
> ```
> git remote add origin https://github.com/你的用户名/juanleme.git
> git branch -M main
> git push -u origin main
> ```

5. **输入 GitHub 账号密码**：
   - 用户名输入你的 GitHub 用户名
   - 密码**不是 GitHub 登录密码**，需要在 GitHub 生成一个 **Token**
   
   **生成 Token 的方法：**
   - 打开 https://github.com/settings/tokens
   - 点击 **Generate new token (classic)**
   - Note: 随便填（如 "push"）
   - 勾选 `repo` 全部权限
   - 点击底部 **Generate token**
   - **复制生成的 token**（只会显示一次）
   - 回到 CMD 密码框，粘贴这个 token 即可

6. **推送成功后**会显示：
```
Enumerating objects: ...
Writing objects: ...
remote: ...
To https://github.com/你的用户名/juanleme.git
 * [new branch]      main -> main
```

✅ **git 推送完成！**

---

## 第三步：在 Railway 部署

1. **打开 Railway 官网：https://railway.app**

2. 点击右上角 **Login**，选择 **Continue with GitHub**
   - 授权 Railway 访问你的 GitHub 账号

3. 登录后点击 **New Project** → **Deploy from GitHub repo**

4. 在弹出的页面中：
   - 点击 **Configure GitHub App**
   - 会跳转到 GitHub 安装页面
   - 点击 **Install & Authorize**
   - 选择 **Only select repositories** → 勾选 **juanleme**
   - 点击 **Install**

5. 回到 Railway，再次点击 **New Project** → **Deploy from GitHub repo**
   - 选择 **juanleme**
   - Railway 会自动开始部署

6. **等待部署完成**（约 3-5 分钟）：
   - 你会看到实时日志滚动
   - 最终出现 `卷了么 API Server` 字样即成功

7. **部署完成后**：
   - Railway 会自动分配一个域名：`https://juanleme-xxxx.up.railway.app`
   - 点击顶部 **Settings** → **Networking** → **Generate Domain** 也可以刷新域名

---

## 第四步：配置环境变量

部署完成后，需要设置一个密钥（JWT_SECRET）：

1. 在 Railway 项目页面，点击 **Variables** 标签

2. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 见下方生成方法 |
| `PORT` | `3001`（Railway 默认已设） |

3. **生成 JWT_SECRET 的方法：**
   - 在 CMD 中执行：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - 把输出的长字符串复制到 JWT_SECRET 的值中

4. 添加后 Railway 会自动重新部署

---

## 第五步：验证上线

1. **点击 Settings → Networking → Generate Domain**（如果还没域名）

2. 复制域名，在浏览器打开（例如 `https://juanleme-xxxx.up.railway.app`）

3. 在页面底部点击 **体验账号一键登录**

4. **验证 API 是否正常：**
   ```
   访问 https://juanleme-xxxx.up.railway.app/api/health
   返回 {"code":200,"message":"success","data":{"status":"ok"}}  ✅
   ```

---

## 第六步：以后每次更新代码

当你修改了代码想发布新版本：

```bash
cd /d "C:\Users\LIUCJ\AppData\Local\Claude-3p\local-agent-mode-sessions\a4b8d586\00000000\local_2a5410ea-500d-4f8f-b270-185de2d8f053\outputs\juanleme"
git add .
git commit -m "改了什么"
git push
```

推送到 GitHub 后，**Railway 会自动重新部署**，什么都不用做。

---

## 常见问题

### Q: 部署失败，日志显示 `npm ERR!`
A: 检查 `railway.json` 配置是否正确。也可以手动在 Railway 的 **Variables** 设置 `NODE_ENV=development` 先看下日志。

### Q: 页面打开空白，控制台 404
A: 前端构建产物没有正确 serve。检查 `backend/src/index.js` 中 `distPath` 路径是否正确。

### Q: 数据库数据会丢失吗？
A: 每次部署 Railway 会重启容器，SQLite 文件在容器重启后**会丢失**。
   - **临时解决**：不重启容器就能保留
   - **永久解决**：换成 PostgreSQL（免费版 Railway 提供 1GB 额度）

**立即换成 PostgreSQL（推荐，10 分钟配置）：**

在 Railway 页面：
1. 点击 **New** → **Database** → **Add PostgreSQL**
2. 复制 `DATABASE_URL` 变量的值
3. 在 **Variables** 中添加 `DATABASE_URL` = 刚才复制的值
4. 用 `database-pg.js` 替换 `database.js`

---

## 最终效果

部署完成后：

```
你的用户 → 打开 https://juanleme-xxxx.up.railway.app
            ↓
           看到登录页 → 体验账号登录 → 开始专注计时
                              ↓
                   数据自动存到云端数据库
```

🎉 **上线成功！** 你现在可以把链接发给任何人使用了。
