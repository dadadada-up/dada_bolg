"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Post } from "@/types/post";
import { useDebounce } from "@/hooks/use-debounce";

// 定义搜索结果接口
interface SearchResults {
  posts: Post[];
  query: string;
  total: number;
  page: number;
  totalPages: number;
}

export function Search() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 使用防抖钩子
  const debouncedQuery = useDebounce(query, 300);

  // 关闭搜索
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    setCurrentPage(1);
  }, []);

  // 处理外部点击关闭搜索
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeSearch]);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 按 / 键打开搜索
      if (event.key === "/" && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
      
      // 按 Esc 键关闭搜索
      if (event.key === "Escape" && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeSearch]);

  // 在搜索打开时自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 处理搜索请求
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&page=${currentPage}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("搜索失败:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, currentPage]);

  // 处理结果点击
  const handleResultClick = (slug: string) => {
    router.push(`/posts/${slug}`);
    closeSearch();
  };

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-secondary"
        aria-label="搜索"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-10">
          <div className="w-full max-w-xl bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center p-4 border-b">
              <SearchIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文章、标签或分类..."
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                autoComplete="off"
              />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                query && (
                  <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              )}
              <button
                onClick={closeSearch}
                className="ml-2 p-1 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {debouncedQuery.trim() && (
              <div className="max-h-96 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">搜索中...</span>
                  </div>
                ) : results?.posts && results.posts.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      找到 {results.total} 条关于 &quot;{results.query}&quot; 的结果
                    </p>
                    
                    {results.posts.map((post) => (
                      <div
                        key={post.slug}
                        onClick={() => handleResultClick(post.slug)}
                        className="border-b pb-4 cursor-pointer hover:bg-muted/40 rounded-md p-2 -mx-2 transition-colors"
                      >
                        <h3 className="font-semibold text-lg mb-1">
                          <span 
                            dangerouslySetInnerHTML={{ 
                              __html: highlightMatch(post.title, results.query) 
                            }} 
                          />
                        </h3>
                        
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                            <span 
                              dangerouslySetInnerHTML={{ 
                                __html: highlightMatch(post.excerpt, results.query) 
                              }} 
                            />
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-1">
                          {post.categories.map((category, index) => (
                            <span
                              key={`${category}-${index}`}
                              className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeSearch();
                                router.push(`/categories/${encodeURIComponent(String(category))}`);
                              }}
                            >
                              {String(category)}
                            </span>
                          ))}
                          
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="text-xs px-2 py-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeSearch();
                                router.push(`/tags/${encodeURIComponent(String(tag))}`);
                              }}
                            >
                              #{String(tag)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {results.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: results.totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-muted-foreground">没有找到匹配的结果</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      尝试使用不同的关键词或更少的筛选条件
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4 bg-muted/40 border-t text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>提示: 按 <kbd className="px-2 py-1 bg-secondary rounded text-xs">/</kbd> 键打开搜索, 按 <kbd className="px-2 py-1 bg-secondary rounded text-xs">ESC</kbd> 键关闭</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 