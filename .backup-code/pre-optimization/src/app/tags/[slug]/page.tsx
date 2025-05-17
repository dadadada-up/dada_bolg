import { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";

// 硬编码的静态参数，避免动态生成
export function generateStaticParams() {
  // 跳过所有API调用，直接返回一个预定义的参数集
  return [{ slug: 'placeholder' }];
}

// 静态元数据，不依赖任何API调用
export const metadata: Metadata = {
  title: "标签文章 - Dada Blog",
  description: "查看标签下的所有文章",
};

// 简化的标签页面组件，不执行任何数据获取
export default function TagPage({ params }: { params: { slug: string } }) {
  const tagName = params.slug;
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/tags" className="text-primary hover:underline">
            ← 返回所有标签
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">#{tagName}</h1>
        <p className="text-muted-foreground mb-8">
          加载中...
        </p>
      </div>
    </MainLayout>
  );
} 