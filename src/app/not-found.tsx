import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 text-center">
      <h1 className="text-9xl font-bold">404</h1>
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
    </div>
  );
} 