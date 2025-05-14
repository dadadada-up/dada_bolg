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
  title: "分类文章 - Dada Blog",
  description: "查看分类下的所有文章",
};

// 简化的分类页面组件，不执行任何数据获取
export default function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = params.slug;
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/categories" className="text-primary hover:underline">
            ← 返回所有分类
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{categorySlug} 分类</h1>
        
        <p className="mb-8 text-muted-foreground">
          加载中...
        </p>
      </div>
    </MainLayout>
  );
} 