"use client";

import { useEffect, useState } from "react";
import { calculateWordCount } from "@/lib/markdown";

interface WordCountProps {
  markdown: string;
  className?: string;
}

export function WordCount({ markdown, className = "" }: WordCountProps) {
  const [stats, setStats] = useState({
    wordCount: 0,
    readingTime: 0,
    characterCount: 0,
  });

  useEffect(() => {
    // 计算字数统计信息
    const { wordCount, readingTime, characterCount } = calculateWordCount(markdown);
    setStats({ wordCount, readingTime, characterCount });
  }, [markdown]);

  return (
    <div className={`text-sm text-muted-foreground flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1">
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
          <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
          <path d="M6 9h12" />
          <path d="M6 12h12" />
          <path d="M6 15h6" />
        </svg>
        <span>{stats.wordCount} 字</span>
      </div>
      
      <div className="flex items-center gap-1">
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>约 {stats.readingTime} 分钟</span>
      </div>
    </div>
  );
}