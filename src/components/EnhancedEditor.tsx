'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Post, Category } from '@/types/post';
import { TagInput } from './TagInput';
import { MarkdownPreview } from './MarkdownPreview';
import { enhancedSlugify } from '@/lib/utils';
import { BytemdEditor } from './bytemd/BytemdEditor';
import { SimpleEditor } from './utils/SimpleEditor';
import { AdvancedEditor } from './utils/AdvancedEditor';

// 动态导入 MDEditor 以避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface EnhancedEditorProps {
  post: Post;
  onChange: (updatedPost: Post) => void;
}

// 常见的标签建议
const TAG_SUGGESTIONS = [
  '前端',
  '后端',
  '设计',
  'React',
  'Next.js',
  '产品经理',
  '需求分析',
  '低代码平台',
  '系统设计',
  '农险'
];

// 创建默认的空Post对象，用于防止属性访问出错
const DEFAULT_POST: Post = {
  slug: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  content: '',
  excerpt: '',
  categories: [],
  tags: [],
};

export function EnhancedEditor({ post = DEFAULT_POST, onChange }: EnhancedEditorProps) {
  // 确保post对象不为空，避免后续属性访问出错
  const safePost = post || DEFAULT_POST;
  
  // 是否显示预览
  const [showPreview, setShowPreview] = useState(false);
  
  // 保存从API获取的分类列表
  const [categoryList, setCategoryList] = useState<string[]>([]);
  
  // 存储原始标题，用于检测标题是否发生变化
  const [originalTitle, setOriginalTitle] = useState(safePost.title || '');
  
  // 初始化时保存原始标题
  useEffect(() => {
    setOriginalTitle(safePost.title || '');
  }, [safePost.title]);
  
  // 从API获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories-new');
        if (response.ok) {
          const data = await response.json();
          // 提取分类名称列表
          const categoryNames = data.map((category: Category) => category.name);
          setCategoryList(categoryNames);
        }
      } catch (error) {
        console.error('获取分类列表失败:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // 处理标题变更，自动更新slug
  const handleTitleChange = (newTitle: string) => {
    // 创建更新后的文章对象
    const updatedPost = {
      ...safePost,
      title: newTitle,
    };
    
    // 如果标题发生了实质性变化，重新生成slug
    // 但只有当用户没有手动修改过slug时才更新
    if (newTitle && newTitle !== originalTitle) {
      // 检查slug是否是由原标题生成的
      const originalSlug = enhancedSlugify(originalTitle, { maxLength: 80 });
      const currentSlug = safePost.slug || '';
      
      // 只有当当前slug与原标题生成的slug匹配时，才自动更新slug
      // 这样可以避免覆盖用户手动设置的slug
      if (currentSlug === originalSlug || currentSlug === '') {
        const newSlug = enhancedSlugify(newTitle, { maxLength: 80 });
        updatedPost.slug = newSlug;
        console.log(`标题已更新，生成新的slug: ${newSlug}`);
      } else {
        console.log('用户可能已手动修改slug，保留当前slug:', currentSlug);
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
      ...safePost,
      [field]: value
    });
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* 左侧元数据面板 */}
      <div className="w-full lg:w-1/3 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">标题</label>
          <input
            type="text"
            value={safePost.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            value={safePost.slug || ''}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Slug会根据标题自动生成，也可手动修改</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">发布日期</label>
          <input
            type="date"
            value={(safePost.date || '').split('T')[0]}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <TagInput
          label="分类"
          value={safePost.categories || []}
          onChange={(value) => handleInputChange('categories', value)}
          required
          suggestions={categoryList}
        />
        
        <TagInput
          label="标签"
          value={safePost.tags || []}
          onChange={(value) => handleInputChange('tags', value)}
          suggestions={TAG_SUGGESTIONS}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">描述</label>
          <textarea
            value={safePost.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="文章描述，用于SEO"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            {safePost.description ? 250 - safePost.description.length : 250} 个字符可用
          </p>
        </div>
      </div>
      
      {/* 右侧内容编辑器 */}
      <div className="w-full lg:w-2/3">
        <div className="mb-2 flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">内容</label>
        </div>
        
        <AdvancedEditor
          value={safePost.content || ''}
          onChange={(value) => handleInputChange('content', value)}
          height={700}
          className="border border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
} 