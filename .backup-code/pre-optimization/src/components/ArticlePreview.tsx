'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Markdown } from './markdown';
import { extractHeadings } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TocWrapper } from './toc-wrapper';
import { motion, useScroll, useSpring } from 'framer-motion';

interface ArticlePreviewProps {
  content: string;
  className?: string;
  debug?: boolean;
  enableProgress?: boolean;
  showTocDrawer?: boolean;
}

/**
 * 文章预览组件，使用MarkdownRenderer渲染Markdown内容
 * 避免使用BytemdViewer导致的unified库版本冲突问题
 */
export function ArticlePreview({
  content,
  className,
  debug = false,
  enableProgress = true,
  showTocDrawer = true
}: ArticlePreviewProps) {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const headingRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const articleRef = useRef<HTMLDivElement>(null);
  const headings = extractHeadings(content);
  const [isTocOpen, setIsTocOpen] = useState(false);
  
  // 阅读进度条
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"]
  });
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // 监听滚动，更新当前可见标题
  useEffect(() => {
    if (!headings.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -70% 0px",
        threshold: 0
      }
    );
    
    // 注册所有标题元素
    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) {
        headingRefs.current[heading.slug] = element;
        observer.observe(element);
      }
    });
    
    return () => {
      headings.forEach((heading) => {
        const element = headingRefs.current[heading.slug];
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);
  
  return (
    <div ref={articleRef} className="relative">
      {enableProgress && (
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-50"
          style={{ scaleX, transformOrigin: "0%" }}
        />
      )}
      
      {/* 移动端目录按钮 */}
      {showTocDrawer && headings.length > 0 && (
        <button
          onClick={() => setIsTocOpen(!isTocOpen)}
          className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg z-40"
          aria-label="目录"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
      
      {/* 移动端目录抽屉 */}
      {showTocDrawer && (
        <div 
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden transform transition-transform duration-300 ${
            isTocOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="absolute right-0 h-full w-3/4 max-w-xs bg-card shadow-xl p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">目录</h3>
              <button
                onClick={() => setIsTocOpen(false)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label="关闭"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <TocWrapper 
              headings={headings} 
              activeId={activeHeading} 
              onHeadingClick={() => setIsTocOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* 调试信息 */}
      {debug && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
          <p>当前激活的标题: <code>{activeHeading || '无'}</code></p>
          <p>标题总数: <code>{headings.length}</code></p>
        </div>
      )}
      
      {/* 主要内容 */}
      <Markdown 
        content={content} 
        className={cn(
          "prose prose-gray dark:prose-invert max-w-none",
          "prose-headings:scroll-mt-24 prose-headings:font-medium prose-a:text-primary",
          "prose-img:rounded-lg prose-img:dark:brightness-90",
          "prose-pre:bg-card prose-pre:border prose-pre:border-border dark:prose-pre:bg-muted/50",
          className
        )} 
      />
    </div>
  );
}
 