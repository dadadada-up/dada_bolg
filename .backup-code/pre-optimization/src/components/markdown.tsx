'use client';

import React, { useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  // 为空内容提供默认值
  const markdownContent = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    return content;
  }, [content]);

  return (
    <ReactMarkdown
      className={cn('markdown-content', className)}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
    >
      {markdownContent}
    </ReactMarkdown>
  );
} 