#!/bin/bash
cd /home/admin/tts-work || exit 1
pkill -f batch-synth >/dev/null 2>&1
sleep 1
rm -f batch2.log
setsid nohup /home/admin/tts-venv/bin/python batch-synth2.py >/tmp/b2.out 2>&1 </dev/null &
sleep 6
echo "--- 进程 ---"
pgrep -af batch-synth2 | head -2
echo "--- 日志 ---"
tail -5 batch2.log 2>/dev/null || echo "(还没写日志)"
tail -5 /tmp/b2.out 2>/dev/null
