"""Serve the built plugin on loopback, with the headers RemNote expects."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        for key in ('If-Modified-Since', 'If-None-Match'):
            if key in self.headers:
                del self.headers[key]
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'baggage, sentry-trace')
        super().end_headers()
os.chdir(Path(__file__).resolve().parent / 'dist')
print('Clear Tree: http://localhost:8080 — keep this window open', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8080), Handler).serve_forever()
