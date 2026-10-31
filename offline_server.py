import os
import sys
import webbrowser
import http.server
import socketserver

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.gltf'):
            return 'application/json'
        if path.endswith('.bin') or path.endswith('.hdr'):
            return 'application/octet-stream'
        return super().guess_type(path)

for p in range(PORT, PORT + 25):
    try:
        httpd = socketserver.TCPServer(("", p), Handler)
        PORT = p
        break
    except OSError:
        continue

url = f"http://localhost:{PORT}/"
print("=" * 68)
print("  OVERSIZED T-SHIRT 3D MOCKUP STUDIO - OFFLINE SERVER")
print("=" * 68)
print(f"  URL: {url}")
print("  Press Ctrl+C to stop the server.")
print("=" * 68)

webbrowser.open(url)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
    httpd.server_close()
