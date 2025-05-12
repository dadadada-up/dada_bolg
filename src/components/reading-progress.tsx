"use client";

import { useEffect, useState } from "react";
import { WordCount } from "./word-count";

interface ReadingProgressProps {
  markdown?: string;
  showWordCount?: boolean;
  showPercentage?: boolean;
}

export function ReadingProgress({ 
  markdown = "", 
  showWordCount = true, 
  showPercentage = true 
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      // 获取文档高度
      const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      // 获取当前滚动位置
      const scrollPosition = window.scrollY;
      // 计算滚动百分比
      const scrollPercentage = (scrollPosition / documentHeight) * 100;
      
      setProgress(scrollPercentage);
      
      // 当用户滚动超过100px时显示进度条和信息
      setIsVisible(scrollPosition > 100);
    };

    // 添加滚动事件监听器，使用节流函数优化性能
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", scrollHandler);
    
    // 初始化进度
    updateProgress();
    
    // 组件卸载时清除事件监听器
    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  return (
    <>
      {/* 进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* 悬浮信息面板 - 仅在滚动时显示 */}
      {(showWordCount || showPercentage) && isVisible && (
        <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg shadow-lg p-3 z-50 transition-opacity duration-300 flex flex-col gap-2">
          {showPercentage && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70"
              >
                <path d="M12 2v20"/>
                <path d="m4.93 10.93 14.14-7.07"/>
                <path d="M20 12H4"/>
                <path d="m4.93 13.07 14.14 7.07"/>
              </svg>
              <span>{Math.round(progress)}% 已阅读</span>
            </div>
          )}
          
          {showWordCount && markdown && (
            <WordCount markdown={markdown} />
          )}
        </div>
      )}
    </>
  );
}