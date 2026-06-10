# JuanLeMe App Launcher
# Run this in PowerShell (right-click -> Run with PowerShell)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================"
Write-Host "     JuanLeMe App Launcher"
Write-Host "========================================"
Write-Host ""

Write-Host "[1/3] Installing backend dependencies..."
Set-Location "$root\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: backend npm install" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - backend installed" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Starting backend server (port 3001)..."
$backend = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory "$root\backend" -NoNewWindow -PassThru
Start-Sleep -Seconds 3
Write-Host "OK - backend running (PID: $($backend.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Installing frontend dependencies..."
Set-Location "$root\client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: frontend npm install" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - frontend installed" -ForegroundColor Green
Write-Host ""

Write-Host "Starting frontend dev server (port 5173)..."
$frontend = Start-Process -FilePath "npx" -ArgumentList "vite --host" -WorkingDirectory "$root\client" -NoNewWindow -PassThru
Write-Host ""

Write-Host "========================================"
Write-Host "  Backend .... http://localhost:3001"
Write-Host "  Frontend ... http://localhost:5173"
Write-Host "========================================"
Write-Host ""
Write-Host "Opening browser..."
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "Press any key to stop all services and exit..."
Read-Host

# Cleanup
Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
