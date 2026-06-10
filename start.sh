#!/bin/bash
echo "============================================"
echo "    卷了么 - 启动向导 (macOS/Linux)"
echo "============================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/3] 安装后端依赖..."
cd "$SCRIPT_DIR/backend"
npm install
if [ $? -ne 0 ]; then
    echo "后端依赖安装失败！"
    exit 1
fi
echo "后端依赖安装完成！"
echo ""

echo "[2/3] 启动后端服务 (端口 3001)..."
node src/index.js &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
sleep 2
echo ""

echo "[3/3] 安装前端依赖..."
cd "$SCRIPT_DIR/client"
npm install
if [ $? -ne 0 ]; then
    echo "前端依赖安装失败！"
    exit 1
fi
echo "前端依赖安装完成！"
echo ""

echo "启动前端开发服务器 (端口 5173)..."
npx vite --host &
FRONTEND_PID=$!
echo ""

echo "============================================"
echo "  后端: http://localhost:3001"
echo "  前端: http://localhost:5173"
echo "  健康检查: http://localhost:3001/api/health"
echo "============================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
