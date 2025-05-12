'use client';

import { useEffect, useState } from 'react';
import { MarkdownContent } from './markdown-content';
import { ReadingProgress } from '../reading-progress';
import { WordCount } from '../word-count';

interface EnhancedMarkdownContentProps {
  html: string;
  markdown: string;
  showReadingProgress?: boolean;
  showWordCount?: boolean;
  className?: string;
}

export function EnhancedMarkdownContent({
  html,
  markdown,
  showReadingProgress = true,
  showWordCount = true,
  className = ''
}: EnhancedMarkdownContentProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 阅读进度条 */}
      {showReadingProgress && (
        <ReadingProgress 
          markdown={markdown} 
          showWordCount={showWordCount} 
        />
      )}
      
      {/* 文章信息区域 */}
      <div className="mb-6 pb-4 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {/* 字数统计 */}
        {showWordCount && (
          <WordCount markdown={markdown} className="order-2 sm:order-1" />
        )}
        
        {/* 分享按钮区域 - 可以在这里添加分享功能 */}
        <div className="order-1 sm:order-2">
          {/* 这里可以添加分享按钮组件 */}
        </div>
      </div>
      
      {/* Markdown内容 */}
      <MarkdownContent html={html} />
      
      {/* 文章底部区域 */}
      <div className="mt-8 pt-4 border-t border-border">
        {showWordCount && (
          <WordCount markdown={markdown} className="mb-4" />
        )}
      </div>
    </div>
  );
}