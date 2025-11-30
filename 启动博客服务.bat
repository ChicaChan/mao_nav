@echo off
chcp 65001 >nul
title 博客服务启动器

echo.
echo ╔════════════════════════════════════════╗
echo ║   搓澡巾技术博客 - 服务启动器 🚀      ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0blog"

echo [1/2] 启动后端服务 (端口 3001)...
start "博客后端服务" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo [2/2] 启动开发服务器 (端口 4321)...
start "博客开发服务器" cmd /k "npm run dev"

echo.
echo ✅ 服务启动完成！
echo.
echo 📝 访问地址：
echo    - 博客首页：http://localhost:4321/
echo    - 管理后台：http://localhost:4321/admin/
echo.
echo 💡 提示：关闭此窗口不会停止服务，请手动关闭弹出的两个窗口
echo.
pause
