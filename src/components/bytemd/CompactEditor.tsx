'use client';

import { useState, useEffect } from 'react';
import { BytemdEditor } from './BytemdEditor';
import { Post } from '@/types/post';
import { enhancedSlugify } from '@/lib/utils';
import { ErrorBoundary } from 'react-error-boundary';
import { SimpleEditor } from '../utils/SimpleEditor';
import { AdvancedEditor } from '../utils/AdvancedEditor';

// 定义分类和标签类型
interface Category {
  id: string | number;
  name: string;
  slug: string;
}

interface Tag {
  id: string | number;
  name: string;
  slug: string;
}

interface CompactEditorProps {
  post: Post;
  onChange: (updatedPost: Post) => void;
}

export function CompactEditor({ post, onChange }: CompactEditorProps) {
  // 默认显示内容编辑标签
  const [activeTab, setActiveTab] = useState<'content' | 'meta'>('content');
  
  // 存储原始标题，用于检测标题是否发生变化
  const [originalTitle, setOriginalTitle] = useState(post.title || '');
  
  // 存储分类和标签数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState({categories: false, tags: false});
  
  // 初始化时保存原始标题
  useEffect(() => {
    setOriginalTitle(post.title || '');
  }, [post.title]);
  
  // 加载分类和标签数据
  useEffect(() => {
    // 加载分类
    const fetchCategories = async () => {
      setLoading(prev => ({...prev, categories: true}));
      try {
        const response = await fetch('/api/categories-new');
        if (!response.ok) {
          throw new Error('获取分类失败');
        }
        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error('加载分类失败:', error);
      } finally {
        setLoading(prev => ({...prev, categories: false}));
      }
    };
    
    // 加载标签
    const fetchTags = async () => {
      setLoading(prev => ({...prev, tags: true}));
      try {
        const response = await fetch('/api/tags-new');
        if (!response.ok) {
          throw new Error('获取标签失败');
        }
        const data = await response.json();
        setTags(data || []);
      } catch (error) {
        console.error('加载标签失败:', error);
      } finally {
        setLoading(prev => ({...prev, tags: false}));
      }
    };
    
    fetchCategories();
    fetchTags();
  }, []);
  
  // 处理标题变更，自动更新slug
  const handleTitleChange = (newTitle: string) => {
    // 创建更新后的文章对象
    const updatedPost = {
      ...post,
      title: newTitle,
    };
    
    // 如果标题发生了实质性变化，重新生成slug
    if (newTitle && newTitle !== originalTitle) {
      // 检查slug是否是由原标题生成的
      const originalSlug = enhancedSlugify(originalTitle, { maxLength: 80 });
      const currentSlug = post.slug || '';
      
      // 只有当当前slug与原标题生成的slug匹配时，才自动更新slug
      // 这样可以避免覆盖用户手动设置的slug
      if (currentSlug === originalSlug || currentSlug === '') {
        const newSlug = enhancedSlugify(newTitle, { maxLength: 80 });
        updatedPost.slug = newSlug;
      }
    }
    
    onChange(updatedPost);
  };
  
  // 处理不同字段的更新
  const handleInputChange = (field: keyof Post, value: any) => {
    // 如果是标题字段，使用专门的处理函数
    if (field === 'title') {
      handleTitleChange(value);
      return;
    }
    
    onChange({
      ...post,
      [field]: value
    });
  };
  
  return (
    <div className="compact-editor">
      {/* 标题输入框 - 始终显示在顶部 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          文章标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={post.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg"
          placeholder="请输入文章标题"
          required
        />
      </div>
      
      {/* 标签页导航 */}
      <div className="flex mb-4 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 ${
            activeTab === 'content'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          内容编辑 <span className="text-red-500">*</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-2 ${
            activeTab === 'meta'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          元数据
        </button>
      </div>
      
      {/* 内容区域 */}
      {activeTab === 'content' ? (
        <div className="content-tab">
          <ErrorBoundary 
            fallbackRender={() => (
              <div className="p-4 text-red-500">编辑器加载失败，请刷新页面重试</div>
            )}
            onError={(error) => console.error('编辑器错误:', error)}
          >
            <AdvancedEditor
            value={post.content || ''}
            onChange={(value) => handleInputChange('content', value)}
              height={800}
              className="border border-gray-300 rounded-md"
          />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="meta-tab">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={post.slug || ''}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Slug会根据标题自动生成，也可手动修改</p>
            </div>
            
            {/* 发布日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发布日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={(post.date || '').split('T')[0]}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {/* 分类 - 修改为单选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={post.categories?.[0] || ''}
                onChange={(e) => handleInputChange('categories', [e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loading.categories}
              >
                <option value="">请选择分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              {loading.categories && <p className="text-xs text-gray-500 mt-1">加载分类中...</p>}
            </div>
            
            {/* 标签 - 使用下拉复选框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <div className="relative">
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {(post.tags || []).map(tagSlug => {
                      const tag = tags.find(t => t.slug === tagSlug);
                      return tag ? (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.name}
                          <button
                            type="button"
                            className="ml-1 text-blue-500 hover:text-blue-700"
                            onClick={() => {
                              const updatedTags = (post.tags || []).filter(t => t !== tagSlug);
                              handleInputChange('tags', updatedTags);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                <select
                    value=""
                  onChange={(e) => {
                      if (e.target.value) {
                        const selectedTag = e.target.value;
                        const currentTags = post.tags || [];
                        if (!currentTags.includes(selectedTag)) {
                          handleInputChange('tags', [...currentTags, selectedTag]);
                        }
                        // 重置选择框
                        e.target.value = "";
                      }
                  }}
                    className="w-full border-0 p-0 focus:ring-0"
                  disabled={loading.tags}
                >
                    <option value="">选择标签...</option>
                    {tags.filter(tag => !(post.tags || []).includes(tag.slug)).map(tag => (
                    <option key={tag.id} value={tag.slug}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                </div>
                {loading.tags && <p className="text-xs text-gray-500 mt-1">加载标签中...</p>}
              </div>
            </div>
            
            {/* 摘要 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea
                value={post.excerpt || ''}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="文章摘要，不填将自动提取内容前几段"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 