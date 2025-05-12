'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/lib/client-api';
import { enhancedSlugify } from '@/lib/utils';
import { ArticlePreview } from '@/components/ArticlePreview';
import { getAllCategories, Category } from '@/lib/category-service';

export default function ImportYuquePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tech-tools'); // 默认选择技术工具分类
  const [tags, setTags] = useState<string[]>(['语雀导入']); // 默认标签
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // 添加分类状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  // 使用useRef存储定时器ID
  const contentProcessTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 在页面加载时自动收起侧边栏
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 保存当前侧边栏状态，以便离开页面时恢复
        const previousState = localStorage.getItem('sidebarCollapsed');
        localStorage.setItem('previousSidebarState', previousState || 'false');
        
        // 设置侧边栏为收起状态
        localStorage.setItem('sidebarCollapsed', 'true');
        
        // 在组件卸载时恢复之前的状态
        return () => {
          try {
            const prevState = localStorage.getItem('previousSidebarState') || 'false';
            localStorage.setItem('sidebarCollapsed', prevState);
            localStorage.removeItem('previousSidebarState');
          } catch (error) {
            console.error('恢复侧边栏状态出错:', error);
          }
        };
      } catch (error) {
        console.error('侧边栏状态管理出错:', error);
      }
    }
  }, []);
  
  // 获取所有分类数据
  useEffect(() => {
    let isMounted = true;
    
    async function fetchCategories() {
      try {
        setIsCategoriesLoading(true);
        // 使用getAllCategories函数而不是直接调用API
        const data = await getAllCategories();
        
        // 确保组件仍然挂载
        if (!isMounted) return;
        
        if (data && data.length > 0) {
          setCategories(data);
          console.log('获取分类成功:', data);
          
          // 如果当前选择的分类不在列表中，设置为默认值
          if (!data.some(c => c.slug === selectedCategory)) {
            setSelectedCategory(data[0].slug);
          }
        } else {
          console.error('获取分类返回空数据');
          // 设置默认分类，避免界面出错
          const defaultCategories = [{
            id: 1,
            name: '技术工具',
            slug: 'tech-tools',
            postCount: 0
          }];
          setCategories(defaultCategories);
          setSelectedCategory('tech-tools');
        }
      } catch (err) {
        console.error('获取分类失败:', err);
        
        // 确保组件仍然挂载
        if (!isMounted) return;
        
        // 设置默认分类，避免界面出错
        const defaultCategories = [{
          id: 1,
          name: '技术工具',
          slug: 'tech-tools',
          postCount: 0
        }];
        setCategories(defaultCategories);
        setSelectedCategory('tech-tools');
      } finally {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }
      }
    }

    fetchCategories();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, []);
  
  // 处理URL参数，支持预填充内容
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 首先尝试从URL参数获取内容
        const searchParams = new URLSearchParams(window.location.search);
        const contentParam = searchParams.get('content');
        const filenameParam = searchParams.get('filename');
        
        let contentToProcess = '';
        let filenameToUse = '';
        
        if (contentParam) {
          // 如果URL参数中有内容，解码并使用
          contentToProcess = decodeURIComponent(contentParam);
          if (filenameParam) {
            filenameToUse = decodeURIComponent(filenameParam);
          }
          console.log('从URL获取内容，长度:', contentToProcess.length);
        } else {
          // 尝试从sessionStorage获取内容
          const storedContent = sessionStorage.getItem('yuqueImportContent');
          const storedFilename = sessionStorage.getItem('yuqueImportFilename');
          
          if (storedContent) {
            contentToProcess = storedContent;
            if (storedFilename) {
              filenameToUse = storedFilename;
            }
            console.log('从sessionStorage获取内容，长度:', contentToProcess.length);
            
            // 使用后清除存储的内容，避免内存泄漏
            sessionStorage.removeItem('yuqueImportContent');
            sessionStorage.removeItem('yuqueImportFilename');
          } else {
            console.log('未找到导入内容');
            return;
          }
        }
        
        // 处理获取到的内容
        if (contentToProcess) {
          // 设置内容
          setContent(contentToProcess);
          
          // 处理内容格式，使用setTimeout确保状态更新后执行
          setTimeout(() => {
            handleContentChange(contentToProcess);
            console.log('内容处理完成');
          }, 100);
          
          // 尝试从内容或文件名提取标题
          const titleMatch = contentToProcess.match(/^#\s+(.*?)$/m);
          if (titleMatch && titleMatch[1]) {
            setTitle(titleMatch[1].trim());
          } else if (filenameToUse) {
            setTitle(filenameToUse.replace(/\.md$/, ''));
            console.log('从文件名设置标题:', filenameToUse.replace(/\.md$/, ''));
          }
        }
      } catch (error) {
        console.error('解析导入内容失败:', error);
        setError('导入内容解析失败，请重试或直接粘贴内容');
      }
    }
  }, []);
  
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

  // 处理内容变化时，处理语雀Markdown
  const handleContentChange = (text: string) => {
    setContent(text);
    if (text) {
      // 使用防抖处理，避免频繁更新
      if (contentProcessTimerRef.current) {
        clearTimeout(contentProcessTimerRef.current);
      }
      
      contentProcessTimerRef.current = setTimeout(() => {
        try {
          const processed = processYuqueMarkdown(text);
          setProcessedContent(processed);
        } catch (err) {
          console.error('处理Markdown内容失败:', err);
          setError('处理Markdown内容时出错，请检查内容格式');
        }
      }, 300); // 300ms防抖
    } else {
      setProcessedContent('');
    }
  };

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
      // 对大文件进行特殊处理
      if (file.size > 1024 * 1024) { // 如果文件大于1MB
        setError(null);
        setSuccessMessage('正在处理大型文件，请稍候...');
      }
      
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
      
      // 清除之前的成功消息
      setSuccessMessage(null);
      
      // 使用Web Worker或分块处理大型文档
      if (text.length > 50000) { // 约50KB
        // 分块处理
        setTimeout(() => {
          try {
            const processed = processYuqueMarkdown(text);
            setProcessedContent(processed);
            setIsProcessing(false);
          } catch (err) {
            console.error('处理大型文档失败:', err);
            setError('处理大型文档时出错，可能是文档格式问题或内容过大');
            setIsProcessing(false);
          }
        }, 100);
      } else {
        // 处理普通大小的文档
        handleContentChange(text);
        setIsProcessing(false);
      }
    } catch (err) {
      setError('读取文件失败');
      console.error('文件读取错误:', err);
      setIsProcessing(false);
    }
  };

  // 处理语雀Markdown格式
  const processYuqueMarkdown = (markdown: string): string => {
    try {
      if (!markdown) return '';
      
      let processed = markdown;
      
      // 处理语雀的特殊格式
      
      // 1. 替换语雀的Mermaid图表标记
      processed = processed.replace(
        /<a name="(?:[^"]+)"><\/a>(?:\s*)<div class="lake-content" typography="classic">(?:\s*)<div class="lake-content" name="(?:[^"]+)">(?:\s*)<div data-card-type="block" data-lake-card="yuque-mermaid" contenteditable="false" data-card-value="data:(?:[^"]+)" data-lake-id="(?:[^"]+)">(?:\s*)<div class="lake-codeblock-content">(?:\s*)<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>(?:\s*)<\/div>(?:\s*)<\/div>(?:\s*)<\/div>(?:\s*)<\/div>/g,
        '```mermaid\n$1\n```'
      );
      
      // 2. 替换语雀的代码块标记
      processed = processed.replace(
        /<div class="lake-content" name="code-block">(?:\s*)<pre><code class="language-([a-zA-Z0-9]+)">([\s\S]*?)<\/code><\/pre>(?:\s*)<\/div>/g,
        '```$1\n$2\n```'
      );
      
      // 3. 替换语雀的图片标记
      processed = processed.replace(
        /<div class="lake-image">(?:\s*)<img src="([^"]+)" data-role="image"[^>]*>(?:\s*)<\/div>/g,
        '![]($1)'
      );
      
      // 4. 替换语雀的表格标记
      processed = processed.replace(
        /<div class="lake-content" name="table">(?:\s*)(<table[\s\S]*?<\/table>)(?:\s*)<\/div>/g,
        '$1'
      );
      
      // 5. 清理语雀特有的HTML标签
      processed = processed.replace(/<span data-type="(?:[^"]+)"[^>]*>([\s\S]*?)<\/span>/g, '$1');
      processed = processed.replace(/<a name="(?:[^"]+)"><\/a>/g, '');
      processed = processed.replace(/<div class="lake-content"[^>]*>/g, '');
      processed = processed.replace(/<\/div>/g, '\n');
      
      // 6. 清理多余的换行
      processed = processed.replace(/\n{3,}/g, '\n\n');
      
      return processed;
    } catch (error) {
      console.error('处理语雀Markdown出错:', error);
      return markdown; // 出错时返回原始内容
    }
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
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('请先输入或上传内容');
      return;
    }
    
    if (!title.trim()) {
      setError('文章标题不能为空');
      return;
    }
    
    // 确保标题不包含任何HTML标签和特殊字符
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
    if (cleanTitle !== title) {
      setTitle(cleanTitle);
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccessMessage('正在处理文章内容...');
    
    // 使用setTimeout延迟处理，避免DOM阻塞
    setTimeout(async () => {
      try {
        // 准备最终内容 - 纯Markdown，不包含YAML
        let finalContent = processedContent;
        
        // 生成slug
        const slug = customSlug.trim() ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') : enhancedSlugify(cleanTitle, { addHash: false });
        
        setSuccessMessage('正在验证内容...');
        // 验证内容
        const validation = validateContent(finalContent);
        if (!validation.isValid) {
          const warningMessage = `内容存在以下问题:\n${validation.issues.join('\n')}`;
          const proceed = confirm(`${warningMessage}\n\n是否仍要继续导入？`);
          if (!proceed) {
            setIsProcessing(false);
            setSuccessMessage(null);
            return;
          }
        }
        
        // 从组件获取的content已经是纯Markdown内容，不包含YAML头
        // 使用接收的参数
        const postTitle = cleanTitle || '语雀导入文章';
        
        setSuccessMessage('正在生成摘要...');
        // 生成摘要
        let excerpt = '';
        // 提取正文前200个字符作为摘录
        const firstParagraph = finalContent.trim().split('\n\n')[0];
        if (firstParagraph) {
          excerpt = firstParagraph.replace(/^#+\s+.*\n/, '').replace(/[#*`]/g, '').trim();
          if (excerpt.length > 200) {
            excerpt = excerpt.substring(0, 200) + '...';
          }
        }
        
        setSuccessMessage('正在处理图片链接...');
        // 处理语雀图片链接，将其替换为代理API链接
        const contentWithProxiedImages = finalContent.replace(
          /!\[(.*?)\]\((https:\/\/cdn\.nlark\.com\/yuque\/.*?)\)/g,
          (match, altText, imageUrl) => {
            // 使用代理API替换语雀图片链接
            const encodedUrl = encodeURIComponent(imageUrl);
            return `![${altText || '语雀图片'}](/api/proxy?url=${encodedUrl})`;
          }
        );
        
        // 获取分类的显示名称
        let displayCategory = selectedCategory;
        const categoryObj = categories.find(c => c.slug === selectedCategory);
        if (categoryObj) {
          displayCategory = categoryObj.name;
        }
        
        setSuccessMessage('正在创建文章...');
        // 创建文章对象 - 不包含YAML头
        const post = {
          title: postTitle,
          content: contentWithProxiedImages,
          excerpt: excerpt,
          categories: [selectedCategory],
          displayCategories: [displayCategory], // 使用正确的显示名称
          tags: tags,
          date: new Date().toISOString(),
          published: true,
          slug: slug,
        };
        
        console.log('正在创建文章:', post);
        
        // 保存文章
        setSuccessMessage('正在保存文章...');
        const result = await createPost(post);
        console.log('创建文章响应:', result);
        
        // 导入成功
        setSuccessMessage(`文章"${postTitle}"导入成功！`);
        
        // 等待1秒再跳转，确保系统有足够时间处理数据
        setTimeout(() => {
          // 使用最可靠的slug来源
          const targetSlug = result?.post?.slug || result?.slug || slug;
          console.log('导入成功，正在跳转到文章列表');
          router.push(`/admin/posts`);
        }, 1000);
      } catch (err) {
        console.error('导入失败:', err);
        setError(err instanceof Error ? err.message : '导入失败，请重试');
        setSuccessMessage(null);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  // 取消导入
  const handleCancel = () => {
    router.back();
  };

  // 渲染分类选择器
  const renderCategoryOptions = () => {
    try {
      if (isCategoriesLoading) {
        return <option value="tech-tools">加载分类中...</option>;
      }
      
      if (!categories || categories.length === 0) {
        return <option value="tech-tools">技术工具 (tech-tools)</option>;
      }
      
      return categories.map((category) => (
        <option key={`category-${category.slug}`} value={category.slug}>
          {category.name} ({category.slug})
        </option>
      ));
    } catch (err) {
      console.error('渲染分类选项出错:', err);
      return <option value="tech-tools">技术工具 (tech-tools)</option>;
    }
  };

  // 处理添加标签
  const handleAddTag = (value: string) => {
    try {
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);
      }
    } catch (err) {
      console.error('添加标签出错:', err);
    }
  };

  // 处理删除标签
  const handleRemoveTag = (index: number) => {
    try {
      const newTags = [...tags];
      newTags.splice(index, 1);
      setTags(newTags);
    } catch (err) {
      console.error('删除标签出错:', err);
    }
  };

  // 添加一个处理图片加载失败的函数
  useEffect(() => {
    // 只在客户端执行
    if (typeof window !== 'undefined') {
      // 添加全局图片错误处理
      const handleImageError = (event: Event) => {
        const img = event.target as HTMLImageElement;
        if (img && img.src && img.src.includes('/api/proxy?url=')) {
          console.warn('语雀图片加载失败:', img.src);
          
          // 提取原始URL
          const match = img.src.match(/\/api\/proxy\?url=([^&]+)/);
          if (match && match[1]) {
            const originalUrl = decodeURIComponent(match[1]);
            console.log('尝试直接加载原始URL:', originalUrl);
            
            // 尝试直接使用原始URL
            img.src = originalUrl;
            
            // 添加提示
            const parent = img.parentElement;
            if (parent) {
              const notice = document.createElement('div');
              notice.className = 'text-amber-500 text-xs mt-1';
              notice.textContent = '注意: 图片可能无法正常显示，请考虑下载后手动上传';
              parent.appendChild(notice);
            }
          }
        }
      };
      
      // 添加全局事件监听器
      document.addEventListener('error', handleImageError, true);
      
      // 清理函数
      return () => {
        document.removeEventListener('error', handleImageError, true);
      };
    }
  }, []);

  // 渲染预览
  const renderPreview = () => {
    if (!processedContent) {
      return (
        <div className="text-center text-gray-500 p-8 border rounded">
          <p>预览将在这里显示</p>
          <p className="text-sm">请粘贴或上传语雀Markdown文档</p>
        </div>
      );
    }
    
    // 使用try-catch包裹预览渲染，防止渲染错误导致整个组件崩溃
    try {
      return (
        <div className="border rounded p-4 bg-white">
          <ArticlePreview content={processedContent} />
        </div>
      );
    } catch (error) {
      console.error('渲染预览出错:', error);
      return (
        <div className="text-center text-red-500 p-8 border rounded">
          <p>预览渲染失败</p>
          <p className="text-sm">可能是Markdown格式不兼容，但您仍可以提交内容</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 container mx-auto px-3 py-4 pb-8">
        {/* 顶部标题和按钮区域 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">导入语雀文档</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isProcessing}
            >
              返回
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isProcessing || !title || !processedContent}
            >
              {isProcessing ? '处理中...' : '导入文章'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
            {error}
            <button className="float-right" onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded">
            {successMessage}
            <button className="float-right" onClick={() => setSuccessMessage(null)}>×</button>
          </div>
        )}
        
        {/* 文章信息区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-md p-4 mb-4 shadow-sm">
          {/* 文章标题 - 更大的字体 - 改为左右结构 */}
          <div className="mb-3 flex items-center">
            <label htmlFor="title" className="text-lg font-medium text-gray-700 w-24 flex-shrink-0">文章标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 text-lg"
              placeholder="输入文章标题"
            />
          </div>
          
          {/* 文章分类和标签 - 调整为一行展示 */}
          <div className="mb-3 grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <label htmlFor="category" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">文章分类</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2"
                disabled={isCategoriesLoading}
              >
                {renderCategoryOptions()}
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="tags" className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">文章标签</label>
              <div className="flex-1 relative">
                <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 min-h-[38px]">
                  {tags.map((tag, index) => (
                    <span 
                      key={`tag-${index}`} 
                      className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                      <button 
                        type="button"
                        className="ml-1 text-blue-500 hover:text-blue-700"
                        onClick={() => handleRemoveTag(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    id="tagInput"
                    className="flex-1 border-0 focus:ring-0 outline-none min-w-[80px] text-sm"
                    placeholder={tags.length > 0 ? "" : "输入标签后按回车添加"}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value) {
                          handleAddTag(value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* 隐藏自定义Slug字段，但仍然保留功能 */}
          <input
            type="hidden"
            id="slug"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
          />
        </div>
        
        {/* 内容区域：Markdown编辑和预览 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左侧：输入区 */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm flex flex-col h-[600px]">
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-medium">Markdown内容</h2>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".md"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-upload"
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm cursor-pointer hover:bg-blue-200"
                >
                  上传文件
                </label>
              </div>
            </div>
            
            <textarea
              className="w-full flex-1 p-4 border rounded-md font-mono text-sm resize-none"
              placeholder="在此粘贴语雀的Markdown内容..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={isProcessing}
            ></textarea>
          </div>
          
          {/* 右侧：预览区 */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm flex flex-col h-[600px]">
            <h2 className="text-lg font-medium mb-3">预览</h2>
            <div className="border rounded-md p-4 flex-1 overflow-y-auto">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 