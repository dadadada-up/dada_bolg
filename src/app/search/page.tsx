"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MainLayout } from '@/components/layout/main-layout';

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
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">搜索结果</h1>
        
        {!query ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">请输入搜索关键词</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">搜索中...</p>
          </div>
        ) : (
          <div>
            <p className="mb-6">
              搜索 &quot;{query}&quot; 的结果:
            </p>
            
            <p className="text-center py-10 text-muted-foreground">
              此功能尚未完全实现，敬请期待
            </p>
            
            <div className="mt-8">
              <Link href="/" className="text-primary hover:underline">
                返回首页
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 