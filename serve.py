#!/usr/bin/env python3
"""Local dev server with the COOP/COEP headers ONNX Runtime Web needs."""
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # silence request logs

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print('Serving at http://localhost:8080')
print('CNN Visualizer → http://localhost:8080/cnn-visualizer/index.html')
HTTPServer(('', 8080), Handler).serve_forever()
