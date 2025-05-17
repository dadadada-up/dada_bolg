"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Heading {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  headings: Heading[];
  activeId?: string | null;
  onHeadingClick?: () => void;
}

export function TableOfContents({ 
  headings, 
  activeId = null, 
  onHeadingClick 
}: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState("");

  // 如果外部传入激活ID，则使用它
  useEffect(() => {
    if (activeId) {
      setActiveHeading(activeId);
    }
  }, [activeId]);

  // 如果未传入激活ID，则自动计算
  useEffect(() => {
    if (activeId !== null) return; // 如果外部控制，则不执行

    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.slug));
      
      const visibleHeadings = headingElements.filter(el => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < 150 && rect.bottom > 0;
      });
      
      if (visibleHeadings.length > 0 && visibleHeadings[0]?.id) {
        setActiveHeading(visibleHeadings[0].id);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始加载时检查
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headings, activeId]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="toc text-sm">
      <ul className="space-y-2">
        {headings.map((heading) => {
          // 计算缩进
          const paddingLeft = (heading.level - 1) * 0.75;
          const isActive = activeHeading === heading.slug;
          
          return (
            <li 
              key={heading.slug} 
              className="line-clamp-1"
              style={{ paddingLeft: `${paddingLeft}rem` }}
            >
              <Link
                href={`#${heading.slug}`}
                className={`block py-1 hover:text-primary transition-colors ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
                onClick={onHeadingClick}
              >
                {heading.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
} 