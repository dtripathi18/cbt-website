#!/usr/bin/env python3
"""Local dev server for previewing the site (plain static HTML/CSS/JS).

Threaded so it can serve a browser tab's keep-alive connections and a
one-off curl/check at the same time instead of queueing behind them.
"""
import http.server

PORT = 8934


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    handler = http.server.SimpleHTTPRequestHandler
    with Server(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
