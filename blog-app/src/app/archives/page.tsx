import { getPosts } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Fragment } from "react";
import { MainLayout } from "@/components/layout/main-layout";

export default async function ArchivesPage() {
  const posts = await getPosts();
  
  // 按年份和月份分组
  type YearData = {
    [month: string]: {
      month: string;
      posts: Array<{
        slug: string;
        title: string;
        date: string;
      }>;
    };
  };
  
  type ArchiveData = {
    [year: string]: YearData;
  };
  
  const archives = posts.reduce((acc, post) => {
    const date = new Date(post.date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    if (!acc[year]) {
      acc[year] = {};
    }
    
    if (!acc[year][month]) {
      acc[year][month] = {
        month,
        posts: [],
      };
    }
    
    acc[year][month].posts.push({
      slug: post.slug,
      title: post.title,
      date: post.date,
    });
    
    return acc;
  }, {} as ArchiveData);
  
  // 转换为排序后的数组
  const years = Object.keys(archives).sort((a, b) => parseInt(b) - parseInt(a));
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-4">文章归档</h1>
          <p className="text-muted-foreground">
            共计 {posts.length} 篇文章
          </p>
        </header>
        
        <div className="space-y-12">
          {years.map(year => (
            <div key={year}>
              <h2 className="text-2xl font-bold mb-8">{year}</h2>
              
              <div className="space-y-8">
                {Object.keys(archives[year])
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .map(month => (
                    <div key={`${year}-${month}`}>
                      <h3 className="text-xl font-semibold mb-4">
                        {year} 年 {parseInt(month)} 月
                      </h3>
                      
                      <div className="space-y-4 ml-6 border-l pl-6">
                        {archives[year][month].posts
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(post => (
                            <div key={post.slug} className="flex items-start gap-4">
                              <time className="text-sm text-muted-foreground min-w-24">
                                {formatDate(post.date)}
                              </time>
                              <Link 
                                href={`/posts/${post.slug}`}
                                className="hover:text-primary transition-colors"
                              >
                                {post.title}
                              </Link>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 