# -*- coding: utf-8 -*-
"""带 UTF-8 charset 的多线程静态服务（WebGAL 并发拉资源，单线程会把连接顶掉）。"""
import http.server
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = int(os.environ.get("PORT", "8081"))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".txt": "text/plain; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".scss": "text/plain; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".webp": "image/webp",
        ".mp3": "audio/mpeg",
    }

    def log_message(self, *args):
        pass


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 128
    allow_reuse_address = True


with Server(("127.0.0.1", PORT), Handler) as httpd:
    print(f"serving on http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()