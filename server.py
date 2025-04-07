import http.server
import socketserver
import json
import os
from pathlib import Path

class BlogRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/docs/posts'):
            # 处理目录请求
            path = self.path[1:]  # 移除开头的斜杠
            if os.path.isdir(path):
                items = []
                for item in os.listdir(path):
                    full_path = os.path.join(path, item)
                    is_dir = os.path.isdir(full_path)
                    items.append({
                        'name': item,
                        'type': 'dir' if is_dir else 'file',
                        'path': full_path
                    })
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(items).encode())
                return
            elif os.path.isfile(path):
                # 处理文件请求
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(content.encode())
                return
        
        # 默认处理其他请求
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def run_server():
    PORT = 8000
    Handler = BlogRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"服务器运行在 http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server() 