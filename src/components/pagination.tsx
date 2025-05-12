"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  maxDisplayedPages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  maxDisplayedPages = 5
}: PaginationProps) {
  // 计算要显示的页码范围
  const getPageRange = () => {
    if (totalPages <= maxDisplayedPages) {
      // 如果总页数小于最大显示页数，显示所有页码
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // 计算起始和结束页码
    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = startPage + maxDisplayedPages - 1;
    
    // 处理边界情况
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  const pageRange = getPageRange();
  
  // 生成页面链接
  const getPageUrl = (page: number) => {
    if (page === 1) {
      return basePath;
    }
    return `${basePath}?page=${page}`;
  };
  
  return (
    <nav className="flex items-center justify-center space-x-2 my-8">
      {/* 上一页按钮 */}
      {currentPage > 1 ? (
        <Link 
          href={getPageUrl(currentPage - 1)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 hover:bg-muted"
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 opacity-50 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      
      {/* 页码链接 */}
      {pageRange.map((page) => (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={`inline-flex items-center justify-center rounded-md h-10 w-10 text-sm font-medium transition-colors
            ${currentPage === page 
              ? "bg-primary text-primary-foreground" 
              : "border border-input bg-background hover:bg-muted"
            }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </Link>
      ))}
      
      {/* 下一页按钮 */}
      {currentPage < totalPages ? (
        <Link 
          href={getPageUrl(currentPage + 1)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 hover:bg-muted"
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 opacity-50 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
} 