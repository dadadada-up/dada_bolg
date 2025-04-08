import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  // 构建文章链接
  const postUrl = `/posts/${post.slug}`;
  console.log(`为文章 ${post.title} 创建链接: ${postUrl}`);
  
  return (
    <article className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {post.coverImage && (
        <div className="relative h-48 w-full">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <Link href={postUrl}>
          <h2 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
        </Link>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="mx-2">·</span>
          <span>{post.readingTime} 分钟阅读</span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {post.categories.map((category, index) => {
            // 确保category是字符串
            const categoryStr = typeof category === 'string' 
              ? category 
              : String(category);
            
            return (
              <Link 
                key={`${categoryStr}-${index}`}
                href={`/categories/${encodeURIComponent(categoryStr)}`}
                className="text-xs bg-gray-100 px-2 py-1 rounded-full hover:bg-blue-100"
              >
                {categoryStr}
              </Link>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag, index) => {
            // 确保tag是字符串
            const tagStr = typeof tag === 'string'
              ? tag
              : String(tag);
              
            return (
              <Link 
                key={`${tagStr}-${index}`}
                href={`/tags/${encodeURIComponent(tagStr)}`}
                className="text-xs text-gray-600 hover:text-blue-600"
              >
                #{tagStr}
              </Link>
            );
          })}
          {post.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>
          )}
        </div>
      </div>
    </article>
  );
} 