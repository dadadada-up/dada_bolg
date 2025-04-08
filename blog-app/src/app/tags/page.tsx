import { Metadata } from "next";
import { getPosts } from "@/lib/github";
import Link from "next/link";
import { slugify, cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";

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
  const posts = await getPosts();
  
  // 获取所有标签并统计每个标签下的文章数量
  const tagsMap = posts.reduce((acc, post) => {
    post.tags.forEach(tag => {
      const tagName = tag.trim();
      if (tagName) {
        const slug = slugify(tagName);
        acc[tagName] = acc[tagName] || { count: 0, slug };
        acc[tagName].count += 1;
      }
    });
    return acc;
  }, {} as Record<string, { count: number; slug: string }>);
  
  // 将标签字典转换为数组并按文章数量降序排序
  const tags = Object.entries(tagsMap)
    .map(([name, { count, slug }]) => ({ name, count, slug }))
    .sort((a, b) => b.count - a.count);
  
  // 计算标签权重 (为了标签云)
  const maxCount = Math.max(...tags.map(tag => tag.count));
  const minCount = Math.min(...tags.map(tag => tag.count));
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
          {tags.map((tag) => {
            const fontSize = getTagFontSize(tag.count);
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
                  ({tag.count})
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
} 