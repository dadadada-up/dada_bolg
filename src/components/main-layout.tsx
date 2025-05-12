import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            博客
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-primary">
              首页
            </Link>
            <Link href="/categories" className="hover:text-primary">
              分类
            </Link>
            <Link href="/tags" className="hover:text-primary">
              标签
            </Link>
            <Link href="/about" className="hover:text-primary">
              关于
            </Link>
            <Link href="/admin" className="hover:text-primary">
              管理
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} 博客. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 