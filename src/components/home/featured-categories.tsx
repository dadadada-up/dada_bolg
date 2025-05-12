import Link from "next/link";
import { Category } from "@/types/post";

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">精选分类</h2>
        <Link href="/categories" className="text-primary hover:underline">
          全部分类 →
        </Link>
      </div>
      
      {/* 使用自动调整的网格布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link 
            key={category.slug} 
            href={`/categories/${category.slug}`}
            className="group"
          >
            <div className="border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary h-full">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">
                {category.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {category.postCount} 篇文章
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 