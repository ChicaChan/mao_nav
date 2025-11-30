@echo off
title Blog Server

echo.
echo ====================================
echo   Blog Server Starter
echo ====================================
echo.

cd /d "%~dp0blog"

if not exist "server.js" (
    echo ERROR: server.js not found!
    pause
    exit
)

echo [1/2] Starting backend server...
start "Backend" cmd /k node server.js
timeout /t 2 /nobreak >nul

echo [2/2] Starting dev server...
start "DevServer" cmd /k npm run dev

echo.
echo ====================================
echo Services started!
echo.
echo Visit: http://localhost:4321/
echo Admin: http://localhost:4321/admin/
echo.
echo Close popup windows to stop
echo ====================================
echo.
pause
