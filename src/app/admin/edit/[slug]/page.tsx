'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditPostRedirect({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  useEffect(() => {
    // 重定向到新的编辑页面路径
    console.log(`旧的编辑页面已弃用，正在重定向到/admin/edit-post/${slug}`);
    router.replace(`/admin/edit-post/${slug}`);
  }, [router, slug]);
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="mb-4 text-2xl font-bold">正在重定向到新的编辑页面...</div>
        <div className="text-muted-foreground">
          请稍候，如果您没有被自动重定向，请点击
          <a href={`/admin/edit-post/${slug}`} className="text-blue-500 hover:underline ml-1">
            这里
          </a>
        </div>
      </div>
    </div>
  );
} 