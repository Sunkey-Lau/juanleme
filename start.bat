@echo off
set "RD=%~dp0"

echo ============================================
echo       JuanLeMe App Launcher
echo ============================================
echo.
echo [0/3] Cleaning npm cache...
call npm cache clean --force >nul 2>&1
echo OK - cache cleaned
echo.
echo [1/3] Installing backend dependencies...
cd /d "%RD%backend"
call npm install
if errorlevel 1 (
    echo FAILED: backend npm install
    echo.
    echo Tip: Run this script as Administrator, or manually run:
    echo   npm cache clean --force
    echo   npm config set cache "C:\Users\LIUCJ\.npm-cache"
    pause
    exit /b 1
)
echo OK - backend installed
echo.
echo [2/3] Starting backend server (port 3001)...
start "juanleme-backend" /d "%RD%backend" node src/index.js
timeout /t 3 >nul
echo OK - backend running
echo.
echo [3/3] Installing frontend dependencies...
cd /d "%RD%client"
call npm install
if errorlevel 1 (
    echo FAILED: frontend npm install
    pause
    exit /b 1
)
echo OK - frontend installed
echo.
echo Starting frontend dev server (port 5173)...
start "juanleme-frontend" /d "%RD%client" npx vite --host
echo.
echo ============================================
echo  Backend .... http://localhost:3001
echo  Frontend ... http://localhost:5173
echo ============================================
echo.
echo Opening browser...
timeout /t 2 >nul
start http://localhost:5173
echo.
pause
