"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "@/components/search";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 border-b">
        <div className="container flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">Dada Blog</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-primary">首页</Link>
            <Link href="/posts" className="hover:text-primary">文章</Link>
            <Link href="/categories" className="hover:text-primary">分类</Link>
            <Link href="/tags" className="hover:text-primary">标签</Link>
            <Link href="/archives" className="hover:text-primary">归档</Link>
            <Link href="/about" className="hover:text-primary">关于</Link>
            <Search />
            <ThemeToggle />
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <Search />
            <ThemeToggle />
            <button onClick={toggleMenu} aria-label="导航菜单" className="p-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" 
                />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden container py-4">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="hover:text-primary">首页</Link>
              <Link href="/posts" className="hover:text-primary">文章</Link>
              <Link href="/categories" className="hover:text-primary">分类</Link>
              <Link href="/tags" className="hover:text-primary">标签</Link>
              <Link href="/archives" className="hover:text-primary">归档</Link>
              <Link href="/about" className="hover:text-primary">关于</Link>
              <Link href="/sitemap" className="hover:text-primary">站点地图</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container py-12">
        {children}
      </main>

      <footer className="bg-secondary py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-2">Dada Blog</h3>
              <p className="text-sm text-muted-foreground">
                基于 Next.js 构建，由 GitHub 提供内容支持
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-center md:text-left">链接</h3>
              <nav className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link href="/" className="text-sm hover:text-primary">首页</Link>
                <Link href="/posts" className="text-sm hover:text-primary">文章</Link>
                <Link href="/categories" className="text-sm hover:text-primary">分类</Link>
                <Link href="/tags" className="text-sm hover:text-primary">标签</Link>
                <Link href="/archives" className="text-sm hover:text-primary">归档</Link>
                <Link href="/about" className="text-sm hover:text-primary">关于</Link>
                <Link href="/sitemap" className="text-sm hover:text-primary">站点地图</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 text-center border-t pt-6">
            <p className="mb-2">© 2024 Dada Blog. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 