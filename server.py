#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
博客系统本地预览服务器
这个脚本提供一个简单的HTTP服务器，用于本地预览博客系统
"""

import http.server
import socketserver
import os
import argparse

class BlogServerHandler(http.server.SimpleHTTPRequestHandler):
    """处理博客预览请求的Handler类"""
    
    def end_headers(self):
        # 添加CORS头，允许所有来源的请求，方便本地开发测试
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def do_GET(self):
        # 设置默认编码为UTF-8
        self.protocol_version = 'HTTP/1.1'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def run_server(port=8000, directory=None):
    """运行HTTP服务器"""
    handler = BlogServerHandler
    
    # 如果指定了目录，设置为当前工作目录
    if directory:
        os.chdir(directory)
        print(f"工作目录已设置为: {directory}")
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"博客预览服务器运行在: http://localhost:{port}")
        print("按Ctrl+C停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='博客系统本地预览服务器')
    parser.add_argument('-p', '--port', type=int, default=8000, help='服务器端口 (默认: 8000)')
    parser.add_argument('-d', '--directory', type=str, help='服务器根目录，默认为当前目录')
    args = parser.parse_args()
    
    run_server(args.port, args.directory) 