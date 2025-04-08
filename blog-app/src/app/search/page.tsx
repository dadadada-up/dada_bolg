"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface SearchResult {
  slug: string;
  title: string;
  excerpt?: string;
  date: string;
  categories: string[];
  tags: string[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.data) {
          setResults(data.data);
        }
      } catch (error) {
        console.error("搜索失败:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">搜索结果</h1>
        <p className="text-muted-foreground">
          {query ? `搜索关键词: "${query}"` : "请输入搜索关键词"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-8">
          <p className="text-muted-foreground">找到 {results.length} 条结果</p>
          <ul className="divide-y space-y-6">
            {results.map((result) => (
              <li key={result.slug} className="pt-6 first:pt-0">
                <article>
                  <h2 className="text-2xl font-semibold mb-2">
                    <Link
                      href={`/posts/${result.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {result.title}
                    </Link>
                  </h2>
                  {result.excerpt && (
                    <p className="text-muted-foreground mb-3">{result.excerpt}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <time className="text-muted-foreground">
                      {formatDate(result.date)}
                    </time>
                    {result.categories.length > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Link
                          href={`/categories/${encodeURIComponent(typeof result.categories[0] === 'string' ? result.categories[0] : String(result.categories[0]))}`}
                          className="text-primary hover:underline"
                        >
                          {typeof result.categories[0] === 'string' ? result.categories[0] : String(result.categories[0])}
                        </Link>
                      </>
                    )}
                    {result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.tags.map((tag, index) => {
                          const tagStr = typeof tag === 'string' ? tag : String(tag);
                          
                          return (
                            <Link
                              key={`${tagStr}-${index}`}
                              href={`/tags/${encodeURIComponent(tagStr)}`}
                              className="bg-secondary px-2 py-1 rounded-md text-xs hover:bg-secondary/80 transition-colors"
                            >
                              {tagStr}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : query ? (
        <div className="py-20 text-center">
          <p className="text-xl text-muted-foreground">未找到与 "{query}" 相关的结果</p>
          <p className="mt-2 text-muted-foreground">尝试使用不同的关键词或检查拼写</p>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-xl text-muted-foreground">请在顶部搜索框中输入关键词</p>
        </div>
      )}
    </div>
  );
} 