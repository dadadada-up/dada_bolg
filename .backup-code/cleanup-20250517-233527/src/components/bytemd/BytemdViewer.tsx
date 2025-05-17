'use client';

import React, { useRef } from 'react';
import { Viewer } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math';
import mermaid from '@bytemd/plugin-mermaid';
import 'bytemd/dist/index.css';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.css';
import './viewer-styles.css';
import { ErrorBoundary } from 'react-error-boundary';

interface BytemdViewerProps {
  value: string;
  className?: string;
}

/**
 * 简化版的 Markdown 查看器组件
 * 专注于正确显示内容，去除不必要的兼容逻辑
 */
export function BytemdViewer({ value, className = '' }: BytemdViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 确保内容是字符串
  const safeContent = (() => {
    if (value === undefined || value === null) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    try {
      return String(value);
    } catch (err) {
      console.error('内容转换失败:', err);
      return '';
    }
  })();
  
  // 如果内容为空，显示提示信息
  if (!safeContent) {
    return (
      <div className={`bytemd-viewer-container ${className}`}>
        <div className="p-4 text-gray-500 italic">暂无内容可预览</div>
      </div>
    );
  }
  
  return (
    <div 
      className={`bytemd-viewer-container ${className}`} 
      ref={containerRef}
    >
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
            <p className="font-bold mb-2">预览渲染失败</p>
            <p className="text-sm mb-2">显示原始内容</p>
            <pre className="bg-white p-3 text-sm border rounded overflow-auto whitespace-pre-wrap">
              {safeContent}
            </pre>
          </div>
        )}
      >
        <div className="markdown-body">
          <Viewer 
            value={safeContent} 
            plugins={[
              gfm(),
              highlight(),
              math(),
              mermaid()
            ]} 
          />
        </div>
      </ErrorBoundary>
    </div>
  );
} 