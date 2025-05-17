import { Post } from "@/types/post";
import { PostCard } from "@/components/post-card";

interface FeaturedPostsProps {
  postSlugs: string[]; // 文章slug列表
  posts: Post[]; // 已获取的文章数据
}

export function FeaturedPosts({ postSlugs, posts }: FeaturedPostsProps) {
  // 从所有文章中筛选出精选文章
  const featuredPosts = posts.filter(post => postSlugs.includes(post.slug));
  
  if (featuredPosts.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">精选文章</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featuredPosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
} 