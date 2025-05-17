"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "@/components/search";
import { useState, useEffect } from "react";
import { AuthLinks } from "@/components/auth-links";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const pathname = usePathname();
  
  // 顶部滚动进度条
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 处理滚动事件，实现滚动隐藏导航栏
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 10) {
        setIsScrolled(false);
        setIsNavHidden(false);
      } else {
        setIsScrolled(true);
        // 向下滚动超过50px，隐藏导航栏
        if (currentScrollY > lastScrollY + 50 && !isMenuOpen) {
          setIsNavHidden(true);
        } 
        // 向上滚动，显示导航栏
        else if (currentScrollY < lastScrollY - 10 || isMenuOpen) {
          setIsNavHidden(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar, { passive: true });
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY, isMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 滚动进度条 */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50"
        style={{ scaleX, transformOrigin: "0%" }}
      />
      
      <header 
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? "py-2 shadow-sm bg-background/95 backdrop-blur-sm" : "py-5"
        } ${
          isNavHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="container flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold">Dada</span>
            <span className="ml-1 text-xl text-muted-foreground">Blog</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: "/", label: "首页" },
              { href: "/posts", label: "文章" },
              { href: "/categories", label: "分类" },
              { href: "/tags", label: "标签" },
              { href: "/archives", label: "归档" },
              { href: "/about", label: "关于" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`relative py-1 transition-colors ${
                  isActive(item.href) 
                    ? "text-primary font-medium" 
                    : "hover:text-primary"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
            <Search />
            <ThemeToggle />
            <AuthLinks />
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <Search />
            <ThemeToggle />
            <AuthLinks />
            <button 
              onClick={toggleMenu} 
              aria-label="导航菜单" 
              className="p-2"
              aria-expanded={isMenuOpen}
            >
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
                  d={isMenuOpen 
                    ? "M6 18L18 6M6 6l12 12" // X形状（关闭图标）
                    : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" // 三条线（菜单图标）
                  }
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 移动端菜单，使用过渡动画 */}
        <div 
          className={`md:hidden container overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-[400px] py-4 border-t mt-3 opacity-100" : "max-h-0 py-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-3">
            {[
              { href: "/", label: "首页" },
              { href: "/posts", label: "文章" },
              { href: "/categories", label: "分类" },
              { href: "/tags", label: "标签" },
              { href: "/archives", label: "归档" },
              { href: "/about", label: "关于" },
              { href: "/sitemap", label: "站点地图" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`py-2 px-3 rounded-md transition-colors ${
                  isActive(item.href) 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-secondary hover:text-primary"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-6 md:py-10">
        {children}
      </main>

      <footer className="bg-secondary py-8 md:py-12 mt-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <h3 className="text-xl font-bold">Dada</h3>
                <span className="ml-1 text-lg text-muted-foreground">Blog</span>
              </div>
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
            <p className="mb-2">© {new Date().getFullYear()} Dada Blog. 保留所有权利。</p>
          </div>
        </div>
      </footer>
      
      {/* 返回顶部按钮 */}
      <BackToTopButton />
    </div>
  );
}

// 返回顶部按钮组件
function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg z-30 transition-opacity ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="返回顶部"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  );
} 