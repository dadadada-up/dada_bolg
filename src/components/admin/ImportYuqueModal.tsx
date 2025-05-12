'use client';

import { useState, useEffect, useRef } from 'react';
import { YuqueImporter } from '../YuqueImporter';
import { createPost } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { enhancedSlugify } from '@/lib/utils';
import { getAllCategories } from '@/lib/category-service';

interface ImportYuqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportYuqueModal({ isOpen, onClose, onSuccess }: ImportYuqueModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedSlug, setImportedSlug] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // 获取分类列表
  useEffect(() => {
    let isMounted = true;
    
    async function loadCategories() {
      if (!isOpen) return;
      
      try {
        setIsLoadingCategories(true);
        const data = await getAllCategories();
        
        if (isMounted) {
          setCategories(data);
          setIsLoadingCategories(false);
        }
      } catch (error) {
        console.error('获取分类失败:', error);
        if (isMounted) {
          setCategories([
            { id: 1, name: '技术工具', slug: 'tech-tools', postCount: 0 },
            { id: 2, name: '产品管理', slug: 'product-management', postCount: 0 },
            { id: 3, name: '思考随笔', slug: 'thoughts', postCount: 0 }
          ]);
          setIsLoadingCategories(false);
        }
      }
    }
    
    loadCategories();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      // 延迟重置状态，确保DOM完全卸载后再重置
      const timer = setTimeout(() => {
        setError(null);
        setImportedSlug(null);
        setIsImporting(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 点击外部关闭模态框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isImporting) return; // 导入中不允许关闭
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      // 使用setTimeout确保事件处理器在DOM完全渲染后注册
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isImporting]);

  // ESC键关闭模态框
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (isImporting) return; // 导入中不允许关闭
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, isImporting]);

  // 如果模态框未打开，不渲染任何内容
  if (!isOpen) return null;

  const handleImport = async (content: string, title: string, category: string, customSlug?: string) => {
    try {
      setIsImporting(true);
      setError(null);
      
      // 从YuqueImporter组件获取的content现在已经是纯Markdown内容，不包含YAML头
      // 使用接收的参数
      const postTitle = title || '语雀导入文章';
      
      // 使用自定义slug或根据标题生成
      const slug = customSlug || enhancedSlugify(postTitle);
      
      // 使用从YuqueImporter传递的分类
      const categories = [category];
      
      // 添加默认标签
      const tags = ['语雀导入'];
      
      // 生成摘要
      let excerpt = '';
      // 提取正文前200个字符作为摘录
      const firstParagraph = content.trim().split('\n\n')[0];
      if (firstParagraph) {
        excerpt = firstParagraph.replace(/^#+\s+.*\n/, '').replace(/[#*`]/g, '').trim();
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 200) + '...';
        }
      }
      
      // 处理语雀图片链接，将其替换为代理API链接
      const finalContent = content.replace(
        /!\[(.*?)\]\((https:\/\/cdn\.nlark\.com\/yuque\/.*?)\)/g,
        (match, altText, imageUrl) => {
          // 使用代理API替换语雀图片链接
          const encodedUrl = encodeURIComponent(imageUrl);
          return `![${altText}](/api/proxy?url=${encodedUrl})`;
        }
      );
      
      // 创建文章对象 - 不包含YAML头
      const post = {
        title: postTitle,
        content: finalContent,
        excerpt: excerpt,
        categories: categories,
        tags: tags,
        date: new Date().toISOString(),
        published: true,
        slug: slug, // 显式设置slug而不是依赖后端生成
      };
      
      console.log('正在创建文章:', post);
      
      // 保存文章
      const result = await createPost(post);
      console.log('创建文章响应:', result);
      
      // 保存导入的slug用于显示
      if (result && result.post && result.post.slug) {
        setImportedSlug(result.post.slug);
      } else if (result && result.slug) {
        setImportedSlug(result.slug);
      } else {
        setImportedSlug(slug); // 如果API没有返回，使用我们生成的slug
      }
      
      // 导入成功
      onSuccess();
      
      // 等待1秒再跳转，确保系统有足够时间处理数据
      setTimeout(() => {
        // 使用最可靠的slug来源
        const targetSlug = result?.post?.slug || result?.slug || slug;
        console.log('正在跳转到:', `/admin/edit-post/${targetSlug}`);
        router.push(`/admin/edit-post/${targetSlug}`);
      }, 1000);
    } catch (err) {
      console.error('导入失败:', err);
      setError(err instanceof Error ? err.message : '导入失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">导入语雀文章</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label="关闭"
            disabled={isImporting}
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <YuqueImporter 
            onImport={handleImport}
            onCancel={onClose}
            categories={categories}
            isLoading={isLoadingCategories}
          />
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-t border-red-100 dark:border-red-800">
            {error}
          </div>
        )}
        
        {importedSlug && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-t border-green-100 dark:border-green-800">
            导入成功！文章Slug: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{importedSlug}</code>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={isImporting}
          >
            {isImporting ? '导入中...' : '取消'}
          </button>
        </div>
      </div>
    </div>
  );
} 