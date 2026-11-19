@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动《今天吃什么？》本地预览...
start "meal-story-server" /min cmd /c "python tools\serve.py"
timeout /t 2 >nul
start "" "http://127.0.0.1:8081/"
echo 已打开浏览器。关闭这个窗口不会停止服务；需要停止请关闭任务栏里的 meal-story-server 窗口。
