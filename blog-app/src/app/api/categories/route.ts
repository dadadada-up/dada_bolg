import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/github';
import { slugify } from '@/lib/utils';
import { Category } from '@/types/post';

export async function GET() {
  try {
    const posts = await getPosts();
    
    // 统计每个分类下的文章数量
    const categoriesMap: Record<string, Category> = {};
    
    posts.forEach(post => {
      post.categories.forEach(categoryName => {
        categoryName = categoryName.trim();
        if (categoryName) {
          const slug = slugify(categoryName);
          
          if (!categoriesMap[categoryName]) {
            categoriesMap[categoryName] = {
              name: categoryName,
              slug,
              postCount: 0
            };
          }
          
          categoriesMap[categoryName].postCount += 1;
        }
      });
    });
    
    // 转换为数组并排序
    const categories = Object.values(categoriesMap)
      .sort((a, b) => b.postCount - a.postCount);
    
    return Response.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 