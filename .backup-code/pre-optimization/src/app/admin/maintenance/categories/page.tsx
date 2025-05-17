'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CategoryMaintenancePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (action: string, endpoint: string) => {
    try {
      setLoading(action);
      setResult(null);
      setError(null);

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '操作失败');
      }

      setResult(data);
      console.log(`[${action}] 结果:`, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error(`[${action}] 错误:`, err);
    } finally {
      setLoading(null);
    }
  };

  const cleanDuplicates = () => executeAction('清理重复分类', '/api/categories-new/clean-duplicates');
  const migrateToDb = () => executeAction('迁移分类到数据库', '/api/categories-new/migrate-to-db');
  const clearCache = () => executeAction('清除分类缓存', '/api/categories-new/clear-cache');
  const updateCounts = () => executeAction('更新文章计数', '/api/categories-new/update-counts');

  // 内联SVG加载图标
  const LoadingIcon = () => (
    <svg
      className="mr-2 h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">分类数据维护</h1>
      <p className="mb-6 text-gray-600">该页面提供了修复分类数据的工具，可用于解决分类数据不一致的问题。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 清理重复分类 */}
        <Card>
          <CardHeader>
            <CardTitle>清理重复分类记录</CardTitle>
            <CardDescription>
              对每个分类slug，保留最新的一条记录，删除重复记录，同时更新文章关联。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              此操作会扫描数据库中的分类表，如果发现多条相同slug的记录，将只保留最新的一条记录，其他记录会被删除。
              同时会更新文章关联，确保所有文章都关联到保留的分类记录。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={cleanDuplicates}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === '清理重复分类' && <LoadingIcon />}
              清理重复分类
            </Button>
          </CardFooter>
        </Card>

        {/* 迁移分类到数据库 */}
        <Card>
          <CardHeader>
            <CardTitle>迁移分类到数据库</CardTitle>
            <CardDescription>
              将categoryMappings中的所有分类迁移到数据库中。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              此操作会检查代码中定义的categoryMappings中的每个分类，确保它们都存在于数据库中。
              如果不存在，将创建该分类；如果存在但名称不同，将更新名称确保一致。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={migrateToDb}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === '迁移分类到数据库' && <LoadingIcon />}
              迁移分类到数据库
            </Button>
          </CardFooter>
        </Card>

        {/* 清除分类缓存 */}
        <Card>
          <CardHeader>
            <CardTitle>清除分类缓存</CardTitle>
            <CardDescription>
              清除API中的分类缓存，确保下次请求时重新加载数据。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              分类API使用了内存缓存来提高性能，此操作会清除这些缓存，确保下次请求时能够获取最新的数据。
              当数据库发生变化但界面没有及时更新时，可以使用此功能。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={clearCache}
              disabled={loading !== null}
              className="w-full"
              variant="outline"
            >
              {loading === '清除分类缓存' && <LoadingIcon />}
              清除缓存
            </Button>
          </CardFooter>
        </Card>

        {/* 更新文章计数 */}
        <Card>
          <CardHeader>
            <CardTitle>更新分类文章计数</CardTitle>
            <CardDescription>
              重新计算每个分类下的文章数量。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              此操作会重新计算每个分类下的文章数量，确保分类的文章计数与实际文章数量一致。
              当文章发布或删除后，分类的文章计数可能不准确，可以使用此功能修复。
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={updateCounts}
              disabled={loading !== null}
              className="w-full"
              variant="outline"
            >
              {loading === '更新文章计数' && <LoadingIcon />}
              更新文章计数
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 结果或错误显示 */}
      {result && (
        <Alert className="mt-6 bg-green-50 border-green-200">
          <AlertTitle>操作成功</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 bg-green-50 p-2 rounded text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mt-6 bg-red-50 border-red-200">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>
            <p className="mt-2 text-red-600">{error}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 