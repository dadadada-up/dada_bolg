'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CategoryMaintenance } from '@/components/admin/CategoryMaintenance';

export default function MaintenancePage() {
  const [tab, setTab] = useState('duplicates');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理重复文章
  const handleFixDuplicates = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // 使用新的整合API
      const response = await fetch('/api/content-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'standard' })
      });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理重复文章时出错');
      console.error('修复重复文章错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 执行增强同步
  const handleEnhancedSync = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/enhanced-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行增强同步时出错');
      console.error('增强同步错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 清除缓存
  const handleCleanCaches = async (includeGithubRefresh = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const endpoint = includeGithubRefresh ? '/api/force-refresh' : '/api/clear-all-caches';
      const method = 'POST';
      
      const response = await fetch(endpoint, { method });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '清除缓存时出错');
      console.error('清除缓存错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 修复YAML
  const handleFixYaml = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/fix-yaml');
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '修复YAML时出错');
      console.error('修复YAML错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 清理脏数据
  const handleCleanDirtyData = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // 使用新的整合API
      const response = await fetch('/api/content-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'advanced' }) 
      });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理脏数据时出错');
      console.error('清理脏数据错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 根据标题删除特定文章
  const [titleToDelete, setTitleToDelete] = useState('');
  
  const handleDeleteByTitle = async () => {
    if (isLoading || !titleToDelete.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // 使用新的整合API
      const response = await fetch('/api/content-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: titleToDelete.trim(),
          slugs: [] // 如果没有明确指定slug，API将根据标题查找
        })
      });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      setTitleToDelete(''); // 清空输入框
    } catch (err) {
      setError(err instanceof Error ? err.message : '根据标题删除文章时出错');
      console.error('删除文章错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // API调试功能
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiStatus, setApiStatus] = useState('准备就绪');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [customSlug, setCustomSlug] = useState('yi-wen-xiang-jie-fang-di-chan-tou-zi-78799b49');
  
  // 测试文章API
  const handleTestArticleApi = async () => {
    if (isLoading || !customSlug.trim()) return;
    
    setIsLoading(true);
    setApiStatus('正在加载文章数据...');
    setApiResponse(null);
    
    try {
      const response = await fetch(`/api/posts-new/${customSlug.trim()}`);
      setApiStatus(`状态码: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setApiStatus(`错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setApiResponse(err instanceof Error ? err.stack : '无详细错误堆栈');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 清除缓存API
  const handleClearCacheApi = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setApiStatus('正在清除缓存...');
    setApiResponse(null);
    
    try {
      const response = await fetch('/api/cache/clear');
      const data = await response.json();
      
      setApiStatus(`缓存清除${data.success ? '成功' : '失败'}`);
      setApiResponse(data);
    } catch (err) {
      setApiStatus(`错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setApiResponse(err instanceof Error ? err.stack : '无详细错误堆栈');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 自定义API调用
  const handleCustomApiCall = async () => {
    if (isLoading || !apiEndpoint.trim()) return;
    
    setIsLoading(true);
    setApiStatus('发送请求中...');
    setApiResponse(null);
    
    try {
      const response = await fetch(apiEndpoint.trim(), { method: apiMethod });
      setApiStatus(`状态码: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setApiStatus(`错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setApiResponse(err instanceof Error ? err.stack : '无详细错误堆栈');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 格式化结果显示
  const formatResult = (result: any) => {
    if (!result) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md overflow-auto max-h-80">
        <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  };
  
  return (
    <div className="container py-6">
      <AdminHeader title="系统维护" subtitle="管理和维护博客系统，清理数据和修复问题" />
      
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="duplicates">文章去重</TabsTrigger>
          <TabsTrigger value="sync">增强同步</TabsTrigger>
          <TabsTrigger value="cache">缓存管理</TabsTrigger>
          <TabsTrigger value="yaml">YAML修复</TabsTrigger>
          <TabsTrigger value="clean">脏数据清理</TabsTrigger>
          <TabsTrigger value="debug">API调试</TabsTrigger>
          <TabsTrigger value="categories">分类维护</TabsTrigger>
        </TabsList>
        
        {/* 文章去重标签内容 */}
        <TabsContent value="duplicates">
          <Card>
            <CardHeader>
              <CardTitle>重复文章处理</CardTitle>
              <CardDescription>
                查找并修复系统中的重复文章，保留最佳版本并删除重复副本
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                此功能将扫描数据库中的所有文章，根据标题和内容相似度识别重复项。对于每组重复文章，
                系统会保留内容最完整、格式最规范的文章，并删除其他副本。这个过程不可逆，请确保在执行前备份数据。
              </p>
              
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleFixDuplicates} 
                  disabled={isLoading}
                >
                  {isLoading ? '处理中...' : '开始处理重复文章'}
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>处理失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {formatResult(result)}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 增强同步标签内容 */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>增强同步</CardTitle>
              <CardDescription>
                使用改进的同步算法从GitHub同步文章，避免产生重复文章
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                增强同步功能使用改进的算法来确保从GitHub同步文章时不会产生重复内容。
                此功能将：
              </p>
              <ul className="list-disc pl-5 mb-4 text-sm space-y-1">
                <li>检测并跳过与数据库中内容相同的文章</li>
                <li>使用确定性算法生成slug，避免随机后缀</li>
                <li>自动修复YAML前置数据中的常见错误</li>
                <li>提供详细的同步报告和错误日志</li>
              </ul>
              
              <Button 
                onClick={handleEnhancedSync} 
                disabled={isLoading}
              >
                {isLoading ? '同步中...' : '执行增强同步'}
              </Button>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>同步失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {formatResult(result)}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 缓存管理标签内容 */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>缓存管理</CardTitle>
              <CardDescription>
                清理系统缓存，确保数据的新鲜度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                缓存管理允许你清理系统的各种缓存，包括GitHub API响应缓存、
                文件系统缓存和API结果缓存。清理缓存后，系统将在下次请求时
                获取最新数据。
              </p>
              
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => handleCleanCaches(false)} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? '清理中...' : '清理所有缓存'}
                </Button>
                
                <Button 
                  onClick={() => handleCleanCaches(true)} 
                  disabled={isLoading}
                >
                  {isLoading ? '刷新中...' : '强制刷新GitHub数据并清理缓存'}
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>清理失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {formatResult(result)}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* YAML修复标签内容 */}
        <TabsContent value="yaml">
          <Card>
            <CardHeader>
              <CardTitle>YAML前置数据修复</CardTitle>
              <CardDescription>
                修复文章中的YAML前置数据问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                此功能可以扫描所有文章，检测并修复YAML前置数据中的常见问题，如：
              </p>
              <ul className="list-disc pl-5 mb-4 text-sm space-y-1">
                <li>分隔符格式错误</li>
                <li>缺少必要字段（如标题、日期等）</li>
                <li>字段格式错误（如日期格式不标准）</li>
                <li>标签或分类格式不一致</li>
              </ul>
              
              <Button 
                onClick={handleFixYaml} 
                disabled={isLoading}
              >
                {isLoading ? '修复中...' : '开始修复YAML'}
              </Button>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>修复失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {formatResult(result)}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 脏数据清理标签内容 */}
        <TabsContent value="clean">
          <Card>
            <CardHeader>
              <CardTitle>高级数据库清理</CardTitle>
              <CardDescription>
                清理系统中的脏数据和问题文章
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 清理脏数据 */}
                <div>
                  <h3 className="text-lg font-medium mb-2">清理脏数据</h3>
                  <p className="mb-4 text-sm">
                    清理已知的脏数据文章，包括格式错误、YAML解析失败、slug异常等问题文章。
                    此功能将尝试从GitHub API缓存和数据库中彻底删除这些文章。
                  </p>
                  
                  <Button 
                    onClick={handleCleanDirtyData} 
                    disabled={isLoading}
                  >
                    {isLoading ? '清理中...' : '清理脏数据'}
                  </Button>
                </div>
                
                {/* 按标题删除文章 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2">根据标题删除文章</h3>
                  <p className="mb-4 text-sm">
                    输入文章标题（精确匹配），删除对应的文章。此操作不可恢复，请谨慎使用。
                  </p>
                  
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={titleToDelete}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTitleToDelete(e.target.value)}
                      placeholder="输入完整文章标题"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button 
                      onClick={handleDeleteByTitle}
                      disabled={isLoading || !titleToDelete.trim()}
                      variant="destructive"
                    >
                      {isLoading ? '删除中...' : '删除'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>操作失败</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {formatResult(result)}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API调试标签内容 */}
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>API调试工具</CardTitle>
              <CardDescription>
                测试和调试系统API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 测试文章API */}
                <div>
                  <h3 className="text-lg font-medium mb-2">测试文章API</h3>
                  <p className="mb-2 text-sm">
                    通过slug获取单篇文章数据，用于测试文章API是否正常工作。
                  </p>
                  
                  <div className="flex gap-2 items-start mb-4">
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomSlug(e.target.value)}
                      placeholder="文章slug"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button 
                      onClick={handleTestArticleApi}
                      disabled={isLoading || !customSlug.trim()}
                    >
                      获取文章
                    </Button>
                  </div>
                </div>
                
                {/* 清除缓存API */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">缓存API测试</h3>
                  <p className="mb-4 text-sm">
                    测试缓存清理API是否工作正常。
                  </p>
                  
                  <Button 
                    onClick={handleClearCacheApi}
                    disabled={isLoading}
                    variant="outline"
                  >
                    测试缓存API
                  </Button>
                </div>
                
                {/* 自定义API调用 */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">自定义API调用</h3>
                  <p className="mb-4 text-sm">
                    输入任意API端点进行测试。
                  </p>
                  
                  <div className="space-y-4 mb-4">
                    <div className="flex gap-2">
                      <select
                        value={apiMethod}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setApiMethod(e.target.value)}
                        className="w-[100px] px-3 py-2 border rounded-md"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      
                      <input
                        type="text"
                        value={apiEndpoint}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setApiEndpoint(e.target.value)}
                        placeholder="API端点，例如 /api/posts-new"
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleCustomApiCall}
                      disabled={isLoading || !apiEndpoint.trim()}
                    >
                      发送请求
                    </Button>
                  </div>
                </div>
                
                {/* API状态和结果 */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">API响应</h3>
                  <p className="mb-1 text-sm font-medium">状态:</p>
                  <p className="mb-4 text-sm">{apiStatus}</p>
                  
                  {apiResponse && (
                    <>
                      <p className="mb-1 text-sm font-medium">响应数据:</p>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md overflow-auto max-h-96 mb-4">
                        <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 分类维护标签页 */}
        <TabsContent value="categories">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">分类维护</h2>
            <p className="text-gray-600">
              管理博客分类数据，包括清理重复数据、迁移分类到数据库、更新文章计数等功能。
            </p>
          </div>
          <CategoryMaintenance />
        </TabsContent>
      </Tabs>
    </div>
  );
} 