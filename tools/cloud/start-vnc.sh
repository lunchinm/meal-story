#!/bin/bash
# 启动云端虚拟桌面 + VNC 网页入口
pkill -f "Xvfb :99" 2>/dev/null
pkill x11vnc 2>/dev/null
pkill websockify 2>/dev/null
sleep 1

setsid Xvfb :99 -screen 0 1440x900x24 >/tmp/xvfb.log 2>&1 </dev/null &
sleep 2
setsid x11vnc -display :99 -nopw -forever -shared -listen localhost -rfbport 5900 \
  >/tmp/x11vnc.log 2>&1 </dev/null &
sleep 2
setsid websockify --web=/usr/share/novnc 6080 localhost:5900 \
  >/tmp/novnc.log 2>&1 </dev/null &
sleep 3

echo "--- 监听端口 ---"
ss -ltn 2>/dev/null | grep -E ":5900|:6080" || echo "(没监听上)"
echo "--- 进程 ---"
pgrep -a Xvfb | head -1
pgrep -a x11vnc | head -1
pgrep -a websockify | head -1
echo "--- 自检 ---"
curl -s -o /dev/null -w "noVNC 首页 HTTP %{http_code}\n" http://127.0.0.1:6080/vnc.html
