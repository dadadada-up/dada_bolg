import { getPosts } from "@/lib/github";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";

export default async function SitemapPage() {
  const posts = await getPosts();
  
  // 获取所有分类
  const categoriesSet = new Set<string>();
  posts.forEach(post => post.categories.forEach(category => categoriesSet.add(category)));
  const categories = Array.from(categoriesSet);
  const categorySlugs = categories.map(category => ({
    name: category,
    slug: slugify(category)
  }));
  
  // 获取所有标签
  const tagsSet = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tagsSet.add(tag)));
  const tags = Array.from(tagsSet);
  const tagSlugs = tags.map(tag => ({
    name: tag,
    slug: slugify(tag)
  }));
  
  // 按年份分组文章
  const postsByYear = posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);
  
  const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a));
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-4">站点地图</h1>
          <p className="text-muted-foreground">
            本站所有页面的导航指南
          </p>
        </header>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">主要页面</h2>
            <ul className="space-y-2 ml-6">
              <li>
                <Link href="/" className="text-primary hover:underline">首页</Link>
              </li>
              <li>
                <Link href="/posts" className="text-primary hover:underline">文章列表</Link>
              </li>
              <li>
                <Link href="/categories" className="text-primary hover:underline">文章分类</Link>
              </li>
              <li>
                <Link href="/tags" className="text-primary hover:underline">文章标签</Link>
              </li>
              <li>
                <Link href="/archives" className="text-primary hover:underline">文章归档</Link>
              </li>
              <li>
                <Link href="/about" className="text-primary hover:underline">关于</Link>
              </li>
              <li>
                <Link href="/search" className="text-primary hover:underline">搜索</Link>
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6">分类</h2>
            <ul className="space-y-2 ml-6">
              {categorySlugs.map(category => (
                <li key={category.slug}>
                  <Link 
                    href={`/categories/${encodeURIComponent(category.slug)}`}
                    className="text-primary hover:underline"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6">标签</h2>
            <div className="flex flex-wrap gap-2 ml-6">
              {tagSlugs.map(tag => (
                <Link 
                  key={tag.slug}
                  href={`/tags/${encodeURIComponent(tag.slug)}`}
                  className="text-primary hover:underline bg-secondary/50 px-2 py-1 rounded"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6">文章归档</h2>
            <div className="space-y-6">
              {years.map(year => (
                <div key={year}>
                  <h3 className="text-xl font-semibold mb-3">{year} 年</h3>
                  <ul className="space-y-2 ml-6">
                    {postsByYear[year]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(post => (
                        <li key={post.slug}>
                          <Link 
                            href={`/posts/${post.slug}`}
                            className="text-primary hover:underline"
                          >
                            {post.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
} 