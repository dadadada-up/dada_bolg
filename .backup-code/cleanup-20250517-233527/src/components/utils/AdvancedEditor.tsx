'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SimpleEditor } from './SimpleEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ErrorBoundary } from 'react-error-boundary';

interface AdvancedEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  className?: string;
  placeholder?: string;
}

/**
 * 提取Markdown文档中的标题
 */
function extractHeadings(markdown: string) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')  // 移除特殊字符
      .replace(/\s+/g, '-');     // 空格替换为连字符
    
    headings.push({ level, text, id });
  }
  
  return headings;
}

/**
 * 目录组件
 */
function TableOfContents({ content }: { content: string }) {
  const headings = extractHeadings(content);
  
  if (headings.length === 0) {
    return <div className="text-gray-400 text-sm italic">暂无目录</div>;
  }
  
  return (
    <div className="toc-container border rounded bg-gray-50 p-4 mb-4">
      <h3 className="font-bold text-lg mb-2">目录</h3>
      <ul className="toc-list">
        {headings.map((heading, index) => (
          <li 
            key={index} 
            className="my-1"
            style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
          >
            <a 
              href={`#${heading.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 增强版Markdown编辑器，支持预览和目录功能
 */
export function AdvancedEditor({
  value,
  onChange,
  height = 500,
  className = '',
  placeholder = '在此输入Markdown内容...'
}: AdvancedEditorProps) {
  // 确保内容是字符串
  const initialContent = typeof value === 'string' ? value : '';
  const [content, setContent] = useState<string>(initialContent);
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  
  // 同步外部值变化
  useEffect(() => {
    if (typeof value === 'string' && value !== content) {
      setContent(value);
    }
  }, [value]);
  
  // 处理内容变化
  const handleChange = (newContent: string) => {
    setContent(newContent);
    onChange(newContent);
  };
  
  // 计算内容区域高度
  const contentHeight = typeof height === 'number'
    ? height - 40 // 减去工具栏高度
    : '500px';
  
  // 处理模式切换
  const handleModeChange = (newMode: 'edit' | 'split' | 'preview') => {
    setMode(newMode);
  };
  
  return (
    <div className={`advanced-editor ${className}`}>
      {/* 编辑器工具栏 */}
      <div className="editor-toolbar flex items-center justify-between bg-gray-100 p-2 border border-gray-300 rounded-t-md" style={{ position: 'relative', zIndex: 50 }}>
        <div className="mode-toggles flex">
          <button
            onClick={() => handleModeChange('edit')}
            className={`editor-nav-button px-3 py-1 rounded ${
              mode === 'edit' 
                ? 'bg-white text-blue-600 border border-gray-300' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            编辑
          </button>
          <button
            onClick={() => handleModeChange('split')}
            className={`editor-nav-button px-3 py-1 rounded mx-2 ${
              mode === 'split' 
                ? 'bg-white text-blue-600 border border-gray-300' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            分屏
          </button>
          <button
            onClick={() => handleModeChange('preview')}
            className={`editor-nav-button px-3 py-1 rounded ${
              mode === 'preview' 
                ? 'bg-white text-blue-600 border border-gray-300' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            预览
          </button>
        </div>
        
        {/* 插入TOC按钮 */}
        <button
          onClick={() => {
            const tocMarker = '[toc]\n\n';
            if (!content.includes('[toc]')) {
              handleChange(tocMarker + content);
            } else {
              alert('文档中已存在目录标记 [toc]');
            }
          }}
          className="toc-button editor-nav-button px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200"
          title="插入目录标记"
        >
          插入目录
        </button>
      </div>
      
      {/* 编辑区和预览区 */}
      <div 
        className="editor-content-container flex border-l border-r border-b border-gray-300 rounded-b-md overflow-hidden"
        style={{ height: contentHeight }}
      >
        {/* 编辑区 */}
        {(mode === 'edit' || mode === 'split') && (
          <div 
            className={`editor-pane ${mode === 'split' ? 'w-1/2 border-r border-gray-300' : 'w-full'}`}
          >
            <SimpleEditor
              value={content}
              onChange={handleChange}
              height="100%"
              className="h-full border-none"
              placeholder={placeholder}
            />
          </div>
        )}
        
        {/* 预览区 */}
        {(mode === 'preview' || mode === 'split') && (
          <div 
            className={`preview-pane overflow-auto p-4 ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
          >
            <ErrorBoundary
              fallbackRender={({ error }) => (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
                  <p className="font-bold mb-2">预览渲染失败</p>
                  <p>{error.message}</p>
                </div>
              )}
            >
              {/* 显示目录 */}
              <TableOfContents content={content} />
              
              {/* 渲染Markdown内容 */}
              <MarkdownRenderer content={content} />
            </ErrorBoundary>
          </div>
        )}
      </div>
      
      {/* 编辑器底部信息栏 */}
      <div className="editor-footer mt-2 flex justify-between text-xs text-gray-500">
        <div>字数: {content.length}</div>
        <div>行数: {(content.match(/\n/g) || []).length + 1}</div>
      </div>
    </div>
  );
} 