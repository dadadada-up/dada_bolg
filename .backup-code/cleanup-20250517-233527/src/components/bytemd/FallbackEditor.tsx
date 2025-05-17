'use client';

import React, { useState, useEffect } from 'react';

interface FallbackEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  error?: Error;
}

/**
 * 备用编辑器，当 BytemdEditor 加载失败时使用
 */
export default function FallbackEditor({ value, onChange, height = 600, error }: FallbackEditorProps) {
  const [content, setContent] = useState<string>(value || '');

  // 同步外部值更新
  useEffect(() => {
    setContent(value || '');
  }, [value]);

  // 处理内容变更
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="fallback-editor-container border border-gray-300 rounded-md overflow-hidden">
      {error && (
        <div className="bg-red-100 border-b border-red-300 p-3 text-red-700">
          <div className="font-bold mb-1">编辑器加载失败</div>
          <div className="text-sm">{error.message}</div>
          <div className="text-xs mt-2 text-gray-600">使用简易编辑器继续编辑</div>
        </div>
      )}
      
      <div className="flex border-b border-gray-200 bg-gray-50 p-2 text-sm">
        <div className="flex-1">简易 Markdown 编辑器</div>
        <div className="text-blue-600 hover:underline cursor-pointer">
          <a href="https://www.markdownguide.org/basic-syntax/" target="_blank" rel="noopener noreferrer">
            Markdown 语法帮助
          </a>
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={handleChange}
        className="w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '300px'
        }}
        placeholder="在此输入 Markdown 内容..."
      />
      
      <div className="flex justify-between text-xs p-2 border-t border-gray-200 bg-gray-50 text-gray-500">
        <div>字数: {content.length}</div>
        <div>行数: {(content.match(/\n/g) || []).length + 1}</div>
      </div>
    </div>
  );
} 