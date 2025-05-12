'use client';

import { useState, useRef, useEffect } from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { enhancedSlugify } from '@/lib/utils';

// 不再直接导入分类服务，改为通过props接收分类数据
type CategoryType = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

type YuqueImporterProps = {
  onImport: (content: string, title: string, category: string, customSlug?: string) => void;
  onCancel: () => void;
  categories: CategoryType[]; // 从父组件接收分类列表
  isLoading?: boolean;
};

export function YuqueImporter({ 
  onImport, 
  onCancel, 
  categories = [], 
  isLoading = false 
}: YuqueImporterProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [processedContent, setProcessedContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // 当分类列表发生变化时，设置默认选中的分类
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].slug);
    }
  }, [categories, selectedCategory]);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      setError('请上传Markdown(.md)文件');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      setContent(text);
      
      // 尝试从文件内容中提取标题
      const titleMatch = text.match(/^#\s+(.*?)$/m);
      if (titleMatch && titleMatch[1]) {
        setTitle(titleMatch[1].trim());
      } else {
        // 使用文件名作为标题 (去掉.md扩展名)
        setTitle(file.name.replace(/\.md$/, ''));
      }
      
      setShowPreview(true);
    } catch (err) {
      setError('读取文件失败');
      console.error('文件读取错误:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文本粘贴
  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    const text = e.target.value;
    setContent(text);
    
    // 尝试从粘贴内容中提取标题
    const titleMatch = text.match(/^#\s+(.*?)$/m) || text.match(/^---\s+title:\s*["']?(.*?)["']?\s/m);
    if (titleMatch && titleMatch[1]) {
      setTitle(titleMatch[1].trim());
    }
  };

  // 当内容变化时，处理语雀Markdown
  useEffect(() => {
    if (content) {
      const processed = processYuqueMarkdown(content);
      setProcessedContent(processed);
    } else {
      setProcessedContent('');
    }
  }, [content]);

  // 处理解析语雀Markdown的函数 - 不再生成YAML头部
  const processYuqueMarkdown = (markdown: string): string => {
    if (!markdown) return '';
    
    let processed = markdown;
    
    // 移除现有的YAML头部，因为我们不需要它
    const hasExistingYaml = processed.startsWith('---');
    if (hasExistingYaml) {
      // 找到第二个 --- 并从那里开始截取
      const secondSeparatorIndex = processed.indexOf('---', 3);
      if (secondSeparatorIndex > 0) {
        processed = processed.substring(secondSeparatorIndex + 3).trim();
      }
    }
    
    // 从内容中提取标题
    let extractedTitle = title;
    if (!extractedTitle) {
      const titleMatch = processed.match(/^#\s+(.*?)$/m);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1].trim().replace(/<[^>]*>/g, '');
        // 从内容中移除标题，因为我们已经将它存储在title变量中
        processed = processed.replace(/^#\s+.*?$/m, '');
        // 更新标题状态
        setTitle(extractedTitle);
      }
    }
    
    // 处理语雀的图片链接，使其在本地博客能正确显示
    processed = processed.replace(
      /!\[(.*?)\]\((https:\/\/cdn\.nlark\.com\/yuque\/.*?\/.*?\/.*?)\)/g,
      (match, altText, url) => {
        // 保留语雀的图片链接并添加备注
        return `![${altText || '语雀图片'}](${url})\n<!-- 语雀导入的图片，可能需要手动下载并替换 -->\n`;
      }
    );
    
    // 处理语雀的Mermaid图表链接
    processed = processed.replace(
      /!\[(.*?)\]\((https:\/\/cdn\.nlark\.com\/yuque\/__mermaid_v3\/.*?\.svg)\)/g,
      (match, altText, url) => {
        // 在图表下方添加注释标记，同时保留图片链接以便显示
        return `![${altText || 'Mermaid图表'}](${url})\n\n<!-- YUQUE_MERMAID -->\n\n`;
      }
    );
    
    // 处理特殊的HTML格式文本（颜色、下划线等）
    // 处理颜色文本
    processed = processed.replace(
      /<font\s+style="color:?(#[0-9a-fA-F]{6}|rgb\(\d+,\s*\d+,\s*\d+\));">(.*?)<\/font>/g,
      (match, color, text) => {
        // 转换为带备注的普通文本
        return text;
      }
    );
    
    // 处理下划线
    processed = processed.replace(
      /<u><font\s+style=".*?">(.*?)<\/font><\/u>/g, 
      (match, text) => {
        return text;
      }
    );
    
    processed = processed.replace(
      /<u>(.*?)<\/u>/g, 
      (match, text) => {
        return text;
      }
    );
    
    // 处理加粗
    processed = processed.replace(
      /<strong>(.*?)<\/strong>/g,
      (match, text) => {
        return `**${text}**`;
      }
    );
    
    // 处理斜体
    processed = processed.replace(
      /<em>(.*?)<\/em>/g,
      (match, text) => {
        return `*${text}*`;
      }
    );
    
    // 处理其他HTML标签
    processed = processed.replace(/<\/?div[^>]*>/g, '');
    processed = processed.replace(/<\/?span[^>]*>/g, '');
    processed = processed.replace(/<\/?p[^>]*>/g, '\n\n');
    
    // 最后，移除所有剩余的HTML标签
    processed = processed.replace(/<[^>]*>/g, '');
    
    // 处理图片占位符
    processed = processed.replace(
      /!\[(.*?)\]\((\/content\/assets\/images\/.*?\/placeholder\.png|https:\/\/cdn\.nlark\.com\/yuque\/.*?\/placeholder\.png)\)/g,
      (match, alt) => {
        return `<!-- 图片占位符: ${alt || '此处需要替换为实际图片'} -->`;
      }
    );

    // 清理空行（减少三个以上连续空行为两个空行）
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    // 不再添加YAML头部，直接返回处理后的Markdown内容
    return processed.trim();
  };

  // 验证处理后的内容
  const validateContent = (content: string): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // 检查语雀图片链接
    const yuqueImages = content.match(/!\[.*?\]\(https:\/\/cdn\.nlark\.com\/yuque\/.*?\)/g);
    if (yuqueImages && yuqueImages.length > 0) {
      issues.push(`文章包含${yuqueImages.length}个语雀图片链接，建议下载后替换为本地图片`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // 提交处理后的内容
  const handleSubmit = () => {
    if (!content.trim()) {
      setError('请先输入或上传内容');
      return;
    }
    
    if (!title.trim()) {
      setError('文章标题不能为空');
      return;
    }
    
    if (!selectedCategory) {
      setError('请选择文章分类');
      return;
    }
    
    // 确保标题不包含任何HTML标签和特殊字符
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
    if (cleanTitle !== title) {
      setTitle(cleanTitle);
    }
    
    // 准备最终内容 - 纯Markdown，不包含YAML
    let finalContent = processedContent;
    
    // 生成slug
    const slug = customSlug.trim() 
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
      : enhancedSlugify(cleanTitle);
      
    // 验证内容
    const validation = validateContent(finalContent);
    if (!validation.isValid) {
      const warningMessage = `内容存在以下问题:\n${validation.issues.join('\n')}`;
      const proceed = confirm(`${warningMessage}\n\n是否仍要继续导入？`);
      if (!proceed) return;
    }
    
    // 使用回调方法将内容传递回父组件
    onImport(finalContent, cleanTitle, selectedCategory, slug);
  };

  // 上传界面
  if (!showPreview) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block mb-2" htmlFor="md-file">上传Markdown文件:</label>
          <input
            id="md-file"
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="w-full p-2 border rounded"
            disabled={isProcessing}
          />
        </div>
        
        <div className="text-center my-4">或</div>
        
        <div>
          <label className="block mb-2" htmlFor="md-content">粘贴Markdown内容:</label>
          <textarea
            id="md-content"
            className="w-full h-60 p-2 border rounded font-mono"
            placeholder="在此粘贴语雀的Markdown内容..."
            onChange={handlePaste}
            value={content}
            disabled={isProcessing}
          ></textarea>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
            <button 
              type="button"
              className="absolute top-0 right-0 p-2" 
              onClick={() => setError(null)}
              aria-label="清除错误"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isProcessing}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => content.trim() ? setShowPreview(true) : setError('请先输入或上传内容')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isProcessing || !content}
          >
            预览
          </button>
        </div>
      </div>
    );
  }
  
  // 预览界面
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
        <div className="w-full md:w-1/2 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">文章标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              自定义Slug (可选)
              <span className="text-gray-500 ml-1 text-xs">不填将自动生成</span>
            </label>
            <input
              type="text"
              id="slug"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder="custom-slug"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {customSlug && (
              <p className="text-sm text-gray-500 mt-1">
                预览: {customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}
              </p>
            )}
          </div>
        
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">文章分类</label>
            {isLoading ? (
              <div className="text-sm text-gray-500">加载分类中...</div>
            ) : (
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id.toString()} value={category.slug}>
                      {category.name} ({category.slug})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="tech-tools">技术工具 (tech-tools)</option>
                    <option value="product-management">产品管理 (product-management)</option>
                    <option value="thoughts">思考随笔 (thoughts)</option>
                  </>
                )}
              </select>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block mb-2">预览:</label>
          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            <MarkdownPreview content={processedContent} />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block mb-2" htmlFor="processed-content">处理后的Markdown:</label>
        <textarea
          id="processed-content"
          className="w-full h-64 p-2 border rounded font-mono text-sm"
          value={processedContent}
          onChange={(e) => setProcessedContent(e.target.value)}
          readOnly={false}
        ></textarea>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button 
            type="button"
            className="absolute top-0 right-0 p-2" 
            onClick={() => setError(null)}
            aria-label="清除错误"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          返回
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={!title || !processedContent || !selectedCategory}
        >
          导入
        </button>
      </div>
    </div>
  );
} 