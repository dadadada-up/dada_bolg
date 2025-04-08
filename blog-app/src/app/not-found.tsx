import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold">页面未找到</h2>
        <p className="mt-4 text-xl text-muted-foreground">
          抱歉，您请求的页面不存在或已被移动。
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
        <div className="mt-12 max-w-md mx-auto">
          <div className="border-t pt-6">
            <p className="text-muted-foreground">
              您可能想要查看以下页面：
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/posts" className="text-primary hover:underline">
                  所有文章
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-primary hover:underline">
                  分类列表
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-primary hover:underline">
                  标签云
                </Link>
              </li>
              <li>
                <Link href="/archives" className="text-primary hover:underline">
                  文章归档
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 