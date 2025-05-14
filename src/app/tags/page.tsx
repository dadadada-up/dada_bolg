import { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";
import { getAllTags } from "@/lib/static-generation";

export const metadata: Metadata = {
  title: "标签 - Dada Blog",
  description: "浏览Dada博客的所有文章标签",
  keywords: ["博客", "标签", "技术", "前端", "生活"],
  openGraph: {
    title: "标签 - Dada Blog",
    description: "浏览Dada博客的所有文章标签",
    type: "website",
    url: "https://dada-blog.vercel.app/tags",
  },
};

export default async function TagsPage() {
  // 通过静态生成工具函数获取所有标签
  const tags = await getAllTags();
  
  if (!tags || tags.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-3xl font-bold mb-4">文章标签</h1>
            <p className="text-muted-foreground">
              加载失败，请稍后再试
            </p>
          </header>
        </div>
      </MainLayout>
    );
  }
  
  // 计算标签权重 (为了标签云)
  const maxCount = Math.max(...tags.map((tag: any) => tag.postCount));
  const minCount = Math.min(...tags.map((tag: any) => tag.postCount));
  const range = maxCount - minCount;
  const fontSizeRange = 1.5; // 最大字体是最小字体的倍数
  
  const getTagFontSize = (count: number) => {
    if (range === 0) return 1;
    const weight = (count - minCount) / range;
    return 1 + weight * (fontSizeRange - 1);
  };
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-4">文章标签</h1>
          <p className="text-muted-foreground">
            共计 {tags.length} 个标签
          </p>
        </header>
        
        <div className="flex flex-wrap gap-4">
          {tags.map((tag: any) => {
            const fontSize = getTagFontSize(tag.postCount);
            return (
              <Link 
                key={tag.slug}
                href={`/tags/${encodeURIComponent(tag.slug)}`}
                className={cn(
                  "px-4 py-2 border rounded-full hover:bg-secondary transition-colors",
                  "hover:text-primary"
                )}
                style={{
                  fontSize: `${fontSize}rem`,
                }}
              >
                {tag.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({tag.postCount})
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
} 