@echo off
title ScrapBazaar Launcher
color 0A
echo.
echo  ============================================
echo   ScrapBazaar B2B Marketplace - Starting...
echo  ============================================
echo.

:: Kill any existing processes on our ports
echo  Clearing ports...
node killports.js
timeout /t 2 /nobreak >nul

:: Start Backend
echo  [1/2] Starting Backend (port 5003)...
start "ScrapBazaar Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 5 /nobreak >nul

:: Start Frontend
echo  [2/2] Starting Frontend (port 5173)...
start "ScrapBazaar Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules/vite/bin/vite.js --port 5173 --force"
timeout /t 6 /nobreak >nul

:: Open browser
echo.
echo  ============================================
echo   Opening http://localhost:5173
echo  ============================================
start "" "http://localhost:5173"

echo.
echo  Both servers are running in separate windows.
echo  Keep them open while using the site.
echo.
echo  Admin Login:
echo    Email:    admin@scrapbazaar.in
echo    Password: Admin@123456
echo.
pause
