#!/usr/bin/env python3
import http.server
import socketserver
import json
import random
import string
from urllib.parse import urlparse, parse_qs

PORT = 8000

# Simple in-memory storage
meetings = {}
participants = {}

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/meetings/create':
            # Create meeting
            meeting_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
            meeting = {
                'id': meeting_id,
                'title': 'New Meeting',
                'created_at': '2024-01-01T00:00:00Z',
                'status': 'active'
            }
            meetings[meeting_id] = meeting
            participants[meeting_id] = []
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'message': 'Meeting created successfully',
                'meeting': {
                    **meeting,
                    'joinUrl': f'http://localhost:{PORT}/demo.html?meeting={meeting_id}'
                }
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path.startswith('/api/meetings/') and self.path.endswith('/join'):
            # Join meeting
            meeting_id = self.path.split('/')[-2]
            if meeting_id in meetings:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'message': 'Successfully joined meeting',
                    'meeting': meetings[meeting_id]
                }
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Meeting not found'}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if self.path.startswith('/api/meetings/'):
            # Get meeting
            meeting_id = self.path.split('/')[-1]
            if meeting_id in meetings:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'meeting': meetings[meeting_id]}).encode())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Meeting not found'}).encode())
        else:
            # Serve static files
            super().do_GET()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Server running at http://localhost:{PORT}")
        print(f"📱 Open http://localhost:{PORT}/demo.html in your browser")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
