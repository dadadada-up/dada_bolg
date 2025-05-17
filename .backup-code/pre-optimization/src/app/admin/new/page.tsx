'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { Post } from '@/types/post';
import { createPost } from '@/lib/api/client';
import Link from 'next/link';
import { BytemdEditor } from '@/components/bytemd/BytemdEditor';
import { ErrorBoundary } from 'react-error-boundary';
import FallbackEditor from '@/components/bytemd/FallbackEditor';
import { SimpleEditor } from '@/components/utils/SimpleEditor';
import { AdvancedEditor } from '@/components/utils/AdvancedEditor';

export default function NewPostPage() {
  const router = useRouter();
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    categories: [],
    tags: [],
    content: '',
    excerpt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [editorError, setEditorError] = useState<Error | null>(null);

  useEffect(() => {
    // 加载分类和标签
    fetch('/api/categories-new').then(res => res.json()).then(setCategories);
    fetch('/api/tags-new').then(res => res.json()).then(setTags);
  }, []);
  
  // 表单校验
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!post.title?.trim()) errors.title = '请输入文章标题';
    if (!post.date) errors.date = '请选择发布日期';
    if (!post.categories || post.categories.length === 0) errors.categories = '请选择文章分类';
    if (!post.content?.trim()) errors.content = '请输入文章内容';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('请填写所有必填字段（标有*号的字段）');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const slug = post.slug || slugify(post.title || '');
      await createPost({ ...post, slug } as Post);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建文章失败');
      setLoading(false);
    }
  };

  // 处理表单字段变更
  const handleFieldChange = (field: keyof Post, value: any) => {
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
        ...prev,
        [field]: safeContent
      }));
    } else {
      setPost(prev => ({
        ...prev,
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

  return (
    <div className="w-full mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">新建文章</h1>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? '正在发布...' : '发布文章'}
          </button>
          <Link href="/admin" className="bg-muted hover:bg-muted/80 px-4 py-2 rounded-md text-sm flex items-center">
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
    </div>
  );
} 