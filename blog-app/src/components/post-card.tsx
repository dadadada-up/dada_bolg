import { Post } from "@/types/post";
import Link from "next/link";
import Image from "next/image";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // 提取发布日期
  const publishDate = new Date(post.date);
  const formattedDate = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(publishDate);
  
  // 计算阅读时间
  const readingTime = post.metadata?.readingTime || Math.ceil(post.content.split(/\s+/).length / 200);
  
  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {post.coverImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform hover:scale-105 duration-300"
            loading="lazy"
            placeholder="blur" 
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
        </div>
      )}
      
      <div className="p-6">
        <Link href={`/posts/${post.slug}`}>
          <h3 className="text-xl font-bold mb-2 hover:text-primary">{post.title}</h3>
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <time dateTime={post.date}>{formattedDate}</time>
          <span>•</span>
          <span>{readingTime} 分钟阅读</span>
        </div>
        
        {post.excerpt && <p className="line-clamp-3 mb-4">{post.excerpt}</p>}
        
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category, index) => {
            // 确保category是字符串
            const categoryStr = typeof category === 'string' 
              ? category 
              : String(category);
            
            return (
              <Link
                key={`${categoryStr}-${index}`}
                href={`/categories/${encodeURIComponent(categoryStr)}`}
                className="text-sm bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground"
              >
                {categoryStr}
              </Link>
            );
          })}
          
          {post.tags.map((tag, index) => {
            // 确保tag是字符串
            const tagStr = typeof tag === 'string'
              ? tag
              : String(tag);
              
            return (
              <Link
                key={`${tagStr}-${index}`}
                href={`/tags/${encodeURIComponent(tagStr)}`}
                className="text-xs bg-secondary px-2 py-1 rounded-full hover:bg-primary hover:text-primary-foreground"
              >
                #{tagStr}
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
} 