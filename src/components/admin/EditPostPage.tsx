'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleEditor } from '@/components/utils/SimpleEditor';
import { AdvancedEditor } from '@/components/utils/AdvancedEditor';
import FallbackEditor from '@/components/bytemd/FallbackEditor';
import { Post } from '@/types/post';
import { ErrorBoundary } from 'react-error-boundary';
import Link from 'next/link';

/**
 * 文章编辑页面组件
 */
interface EditPostPageProps {
  slug: string;
}

export default function EditPostPage({ slug }: EditPostPageProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editorError, setEditorError] = useState<Error | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // 加载文章数据和分类标签
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // 并行请求文章、分类和标签数据
        const [postResponse, categoriesResponse, tagsResponse] = await Promise.all([
          fetch(`/api/posts-new/${slug}?nocache=true&t=${Date.now()}`),
          fetch('/api/categories-new'),
          fetch('/api/tags-new')
        ]);
        
        if (!postResponse.ok) {
          throw new Error(`加载文章失败: ${postResponse.status}`);
        }
        
        const postData = await postResponse.json();
        const categoriesData = await categoriesResponse.json();
        const tagsData = await tagsResponse.json();
        
        setPost(postData);
        setOriginalSlug(postData.slug); // 保存原始slug
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  // 表单校验
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!post?.title?.trim()) errors.title = '请输入文章标题';
    if (!post?.date) errors.date = '请选择发布日期';
    if (!post?.categories || post.categories.length === 0) errors.categories = '请选择文章分类';
    if (!post?.content?.trim()) errors.content = '请输入文章内容';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理字段值变更
  const handleFieldChange = (field: keyof Post, value: any) => {
    if (!post) return;
    
    // 特殊处理 content 字段
    if (field === 'content') {
      // 确保内容始终为字符串
      const safeContent = (() => {
        if (value === undefined || value === null) {
          return '';
        }
        if (typeof value === 'string') {
          return value;
        }
        try {
          return String(value);
        } catch (err) {
          console.error('内容转换为字符串出错:', err);
          return '';
        }
      })();
      
      setPost(prev => ({
        ...prev!,
        [field]: safeContent
      }));
    } else {
      setPost(prev => ({
        ...prev!,
        [field]: value
      }));
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  // 处理编辑器错误
  const handleEditorError = (error: Error) => {
    console.error('编辑器错误:', error);
    setEditorError(error);
  };

  // 处理保存文章
  const handleSave = async () => {
    if (!post || isSaving) return;
    
    // 表单验证
    if (!validateForm()) {
      setError('请填写所有必填字段（标有*号的字段）');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // 判断slug是否发生变化
      const isSlugChanged = post.slug !== originalSlug;
      
      // 创建用于提交的文章对象，确保包含ID和使用正确的slug
      const postToSave = {
        ...post,
        // 确保包含文章ID
        id: post.id,
        // 如果用户没有修改slug，则使用原始slug
        // 如果用户修改了slug，则使用新的slug
        slug: isSlugChanged ? post.slug : originalSlug
      };
      
      // 检查ID是否存在
      if (!postToSave.id) {
        console.warn('警告: 文章ID不存在，可能会导致创建新文章而不是更新现有文章');
      } else {
        console.log('保存文章，包含ID:', postToSave.id);
      }
      
      // 使用原始slug进行保存，确保API能找到这篇文章
      const response = await fetch(`/api/posts-new/${originalSlug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postToSave),
      });
      
      // 获取响应数据
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `保存失败: ${response.status}`);
      }
      
      console.log('保存成功，响应:', responseData);
      
      // 设置保存成功状态
      setSaveSuccess(true);
      
      // 如果slug已更改，需要刷新页面或重定向
      if (isSlugChanged) {
        // 延迟一点时间再跳转，让用户感知到保存成功
        setTimeout(() => {
          router.push(`/admin/edit-post/${post.slug}`);
        }, 1000);
      } else {
        // 不需要重定向，只需返回文章列表
        setTimeout(() => {
          router.push('/admin/posts');
        }, 1000);
      }
    } catch (err) {
      console.error('保存文章失败:', err);
      setError(err instanceof Error ? err.message : '保存失败：未知错误');
      setIsSaving(false);
    }
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>正在加载文章...</p>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error && !post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 max-w-xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">加载文章时出错</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-gray-600 mb-6">请检查slug是否正确或尝试刷新页面。</p>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/admin/posts')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              返回文章列表
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染编辑器
  return (
    <div className="w-full mx-auto pb-20">
      {/* 成功提示 */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50 animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>文章保存成功，正在返回列表页...</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <div className="flex gap-4">
        <button 
          onClick={handleSave}
          disabled={isSaving || saveSuccess}
            className={`px-4 py-2 rounded-md text-white ${
            isSaving || saveSuccess
              ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSaving ? "正在保存..." : saveSuccess ? "保存成功" : "保存文章"}
        </button>
          <Link href="/admin/posts" className="bg-muted hover:bg-muted/80 px-4 py-2 rounded-md text-sm flex items-center">
            返回列表
          </Link>
        </div>
      </div>
      
      {/* 错误提示 */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {/* 字段错误提示 */}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">请完成以下必填项：</p>
          <ul className="list-disc ml-5 mt-1">
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {post && (
        <>
          {/* 元数据表单 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文章标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={post.title || ''}
                onChange={e => handleFieldChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg"
                placeholder="请输入文章标题"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 <span className="text-red-500">*</span></label>
              <select
                value={post.categories?.[0] || ''}
                onChange={e => handleFieldChange('categories', [e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">请选择分类</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <select
                multiple
                value={post.tags || []}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  handleFieldChange('tags', selected);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                size={4}
              >
                {tags.map((tag: any) => (
                  <option key={tag.id} value={tag.slug}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发布日期 <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={post.date || ''}
                onChange={e => handleFieldChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea
                value={post.excerpt || ''}
                onChange={e => handleFieldChange('excerpt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="文章摘要，不填将自动提取内容前几段"
              />
            </div>
          </div>
          
          {/* 编辑器 */}
          <div className="w-full overflow-hidden mt-4">
            <ErrorBoundary 
              fallbackRender={({ error }) => (
                <FallbackEditor
                  value={typeof post.content === 'string' ? post.content : ''}
                  onChange={(val) => handleFieldChange('content', val)}
                  height={800}
                  error={error}
                />
              )}
              onError={handleEditorError}
            >
              {!editorError ? (
                <AdvancedEditor
                  value={typeof post.content === 'string' ? post.content : ''}
                  onChange={(val) => {
                    try {
                      // 直接调用处理函数，确保类型安全
                      handleFieldChange('content', val);
                    } catch (err) {
                      console.error('处理编辑器内容变更出错:', err);
                      // 发生错误时回退到备用编辑器
                      setEditorError(err instanceof Error ? err : new Error(String(err)));
                    }
                  }}
                  height={800}
                  className="border border-gray-300 rounded-md"
                />
              ) : (
                <FallbackEditor
                  value={typeof post.content === 'string' ? post.content : ''}
                  onChange={(val) => handleFieldChange('content', val)}
                  height={800}
                  error={editorError}
        />
              )}
            </ErrorBoundary>
          </div>
        </>
      )}
    </div>
  );
} 