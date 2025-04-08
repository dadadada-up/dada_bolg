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
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
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
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="toc text-sm">
      <ul className="space-y-2">
        {headings.map((heading) => {
          // 计算缩进
          const paddingLeft = (heading.level - 1) * 0.75;
          
          return (
            <li 
              key={heading.slug} 
              className="line-clamp-1"
              style={{ paddingLeft: `${paddingLeft}rem` }}
            >
              <Link
                href={`#${heading.slug}`}
                className={`block py-1 hover:text-primary transition-colors ${
                  activeHeading === heading.slug ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
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