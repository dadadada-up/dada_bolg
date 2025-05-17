import { Post } from "@/types/post";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

// 基于文章分类或标题生成随机但固定的颜色
function getPostColorClass(post: Post) {
  // 生成基于文章标题或分类的哈希值，确保同一文章总是获得相同颜色
  const str = post.categories?.[0] || post.title;
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // 几种预定义的优雅颜色类
  const colorClasses = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-amber-100 text-amber-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-cyan-100 text-cyan-800",
  ];
  
  // 根据哈希值选择颜色
  const index = Math.abs(hash) % colorClasses.length;
  return colorClasses[index];
}

export function PostCard({ post }: PostCardProps) {
  // 如果没有slug，生成一个临时的
  const hasValidSlug = post.slug && post.slug.trim() !== '';
  
  // 创建文章内容包装器
  const ArticleContent = () => (
    <div className="flex flex-col justify-between h-full">
      {/* 文章信息 */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight line-clamp-2 mb-2">{post.title}</h2>
          
          {/* 分类标签 */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.categories.slice(0, 2).map((category, index) => (
                <span key={category} className={`px-2 py-0.5 rounded-full text-xs ${getPostColorClass(post)}`}>
                  {post.displayCategories?.[index] || category}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-muted-foreground text-sm line-clamp-3 mt-2">
            {post.description || post.excerpt || "这篇文章暂无摘要，点击查看完整内容..."}
          </p>
        </div>
        
        {/* 标签和元数据 */}
        <div className="flex flex-wrap items-center gap-2 text-sm mt-4">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-auto">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.readingTime && (
              <span>{post.readingTime} 分钟</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // 如果有有效的slug，则渲染为链接
  if (hasValidSlug) {
    return (
      <Link href={`/posts/${post.slug}`} className="group">
        <article className="h-full flex flex-col relative overflow-hidden rounded-lg border bg-background p-5 transition-all hover:shadow-md hover:border-primary">
          <ArticleContent />
        </article>
      </Link>
    );
  }
  
  // 否则仅渲染文章卡片，但不可点击
  return (
    <article className="h-full flex flex-col relative overflow-hidden rounded-lg border bg-background p-5 opacity-70">
      <ArticleContent />
      <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-60">
        <span className="text-sm text-muted-foreground">文章暂不可用</span>
      </div>
    </article>
  );
} 