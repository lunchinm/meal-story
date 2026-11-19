#!/bin/bash
cd "$HOME/tts-work" || exit 1
pkill -f cloud-window.py >/dev/null 2>&1
sleep 1
export DISPLAY=:99
setsid nohup "$HOME/tts-venv/bin/python" cloud-window.py >/tmp/cloudwin.log 2>&1 </dev/null &
sleep 15
echo "--- 日志 ---"
tail -6 /tmp/cloudwin.log
echo "--- 进程 ---"
pgrep -af "cloud-window.py" | head -2
echo "--- 虚拟屏上的窗口 ---"
DISPLAY=:99 xwininfo -root -children 2>/dev/null | grep -c "0x" || echo "?"
