'use client';

import { useState, useEffect, forwardRef, useRef, useCallback } from 'react';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math';
import mermaid from '@bytemd/plugin-mermaid';
import { imageUploadPlugin } from './image-upload-plugin';
import { customZhPlugin } from './custom-plugins';
import zhHans from 'bytemd/locales/zh_Hans.json';
import 'bytemd/dist/index.css';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.css';
import './styles.css'; // 自定义样式
import { ErrorBoundary } from 'react-error-boundary';

interface BytemdEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  fullscreen?: boolean;
  postId?: number;
}

/**
 * 简化版的 Markdown 编辑器组件
 * 专注于编辑功能，去除复杂的兼容逻辑
 */
export const BytemdEditor = forwardRef<HTMLDivElement, BytemdEditorProps>((props, ref) => {
  const { 
    value = '', 
    onChange, 
    height = 800, 
    fullscreen = false, 
    postId
  } = props;
  
  // 确保内容是字符串
  const initialContent = typeof value === 'string' ? value : '';
  const [content, setContent] = useState<string>(initialContent);
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [editorError, setEditorError] = useState<string | null>(null);
  
  // 当传入的值改变时更新内部状态
  useEffect(() => {
    const safeValue = typeof value === 'string' ? value : '';
    setContent(safeValue);
  }, [value]);
  
  // 处理内容更改
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);
  
  // 配置插件
  const plugins = [
    gfm(),
    highlight(),
    math(),
    mermaid(),
    imageUploadPlugin({
      uploadUrl: postId ? `/api/images?postId=${postId}` : '/api/images'
    }),
    customZhPlugin(),
  ];
  
  // 动态样式
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .markdown-editor-container {
        width: 100%;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: ${typeof height === 'number' ? `${height}px` : height};
      }
      
      .markdown-editor-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        height: 100vh !important;
        width: 100vw !important;
        border-radius: 0;
      }
      
      .markdown-editor-toolbar {
        display: flex;
        padding: 8px 12px;
        background-color: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .mode-toggle-btn {
        padding: 4px 10px;
        border: 1px solid #e2e8f0;
        background-color: white;
        margin-right: 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .mode-toggle-btn.active {
        background-color: #e5e7eb;
        font-weight: 500;
      }
      
      .markdown-editor-body {
        flex: 1;
        display: flex;
        overflow: hidden;
        position: relative;
      }
      
      .markdown-editor-edit-area {
        flex: 1;
        overflow: auto;
      }
      
      .markdown-editor-footer {
        padding: 4px 12px;
        border-top: 1px solid #e2e8f0;
        background-color: #f8fafc;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #64748b;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [height]);
  
  return (
    <div 
      className={`markdown-editor-container ${fullscreen ? 'markdown-editor-fullscreen' : ''}`}
      ref={ref}
    >
      {/* 错误提示 */}
      {editorError && (
        <div className="bg-red-100 border border-red-300 text-red-600 p-2 text-sm">
          {editorError}
        </div>
      )}
      
      {/* 工具栏 */}
      <div className="markdown-editor-toolbar">
        <button
          type="button"
          className={`mode-toggle-btn ${mode === 'edit' ? 'active' : ''}`}
          onClick={() => setMode('edit')}
        >
          编辑
        </button>
      </div>
      
      {/* 编辑器主体 */}
      <div className="markdown-editor-body">
        <div className="markdown-editor-edit-area">
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center text-red-500">
                <p className="font-bold mb-2">编辑器加载失败</p>
                <p className="text-sm">请尝试刷新页面或使用简易编辑器</p>
                <textarea
                  className="w-full h-80 p-4 mt-4 font-mono text-sm border border-gray-300 rounded"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>
            }
            onError={(error) => {
              console.error('编辑器加载错误:', error);
              setEditorError('编辑器加载失败，已启用简易编辑模式');
            }}
          >
            <Editor
              value={content}
              onChange={handleContentChange}
              plugins={plugins}
              locale={zhHans}
            />
          </ErrorBoundary>
        </div>
      </div>
      
      {/* 状态栏 */}
      <div className="markdown-editor-footer">
        <span>字数: {content.length} | 行数: {content.split('\n').length}</span>
      </div>
    </div>
  );
}); 