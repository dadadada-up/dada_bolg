"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // 获取文档高度
      const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      // 获取当前滚动位置
      const scrollPosition = window.scrollY;
      // 计算滚动百分比
      const scrollPercentage = (scrollPosition / documentHeight) * 100;
      
      setProgress(scrollPercentage);
    };

    // 添加滚动事件监听器
    window.addEventListener("scroll", updateProgress);
    
    // 初始化进度
    updateProgress();
    
    // 组件卸载时清除事件监听器
    return () => {
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
} 