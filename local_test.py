#!/usr/bin/env python3
"""Local dev server for FRPortfolio.

Usage:
    python3 local_test.py          # port 8000
    python3 local_test.py 3000     # custom port

Why not just `python3 -m http.server`?
- Cache-Control: no-store -> edits to CSS/JS show up immediately, no hard refresh
- allow_reuse_address -> fast restarts, no "address already in use"
- Handles port-in-use errors with a helpful "try another port" hint
"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = "."


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    # Local dev: never let the browser serve a stale stylesheet or page.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


# Force socket release on Linux/Mac to prevent "address already in use"
# on rapid restarts. (On Windows this behaves differently — comment this
# out if you develop on Windows and hit weird double-bind issues.)
socketserver.TCPServer.allow_reuse_address = True


def main():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            sys.stdout.write(
                f"Serving '{os.path.abspath(DIRECTORY)}' at http://localhost:{PORT}\n"
            )
            sys.stdout.flush()
            httpd.serve_forever()
    except KeyboardInterrupt:
        sys.stdout.write("\nStopped.\n")
        sys.exit(0)
    except OSError as e:
        sys.stderr.write(f"Failed to bind port {PORT}: {e}\n")
        sys.stderr.write(f"Try another port: python3 {sys.argv[0]} {PORT + 1}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
    