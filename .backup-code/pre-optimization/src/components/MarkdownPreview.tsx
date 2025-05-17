'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import remarkUnwrapImages from 'remark-unwrap-images';
import remarkAdmonitions from '@/lib/markdown/remark-admonitions';
import { ErrorBoundary } from 'react-error-boundary';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  debug?: boolean;
}

/**
 * 基于React-Markdown的Markdown预览组件
 * 避免使用unified 10.x版本的依赖，替代BytemdViewer
 */
export function MarkdownPreview({ content, className = '', debug = false }: MarkdownPreviewProps) {
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 确保内容是字符串
  const safeContent = (() => {
    if (content === undefined || content === null) {
      return '';
    }
    
    if (typeof content === 'string') {
      return content;
    }
    
    try {
      return String(content);
    } catch (err) {
      console.error('内容转换失败:', err);
      return '';
    }
  })();
  
  // 调试输出
  useEffect(() => {
    if (debug) {
      console.log('[MarkdownPreview] 渲染内容:', { 
        contentType: typeof content,
        contentLength: safeContent.length,
        sample: safeContent.substring(0, 50) + (safeContent.length > 50 ? '...' : '')
      });
    }
  }, [content, safeContent, debug]);
  
  // 处理 Mermaid 图表渲染
  useEffect(() => {
    // 只在客户端执行，且只处理包含mermaid内容的情况
    if (typeof window === 'undefined' || !safeContent.includes('```mermaid')) {
      return;
    }

    // 加载 mermaid 并初始化
    const loadMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: true,
              theme: 'default', 
          securityLevel: 'strict',
          fontFamily: 'sans-serif',
            });
        
        setMermaidLoaded(true);
          
        // 等待 DOM 更新后渲染图表
        setTimeout(() => {
          if (containerRef.current) {
            try {
              const mermaidDiagrams = containerRef.current.querySelectorAll('.language-mermaid');
              if (mermaidDiagrams.length > 0) {
                console.log(`找到 ${mermaidDiagrams.length} 个 mermaid 图表，开始渲染`);
                mermaid.init(undefined, mermaidDiagrams as NodeListOf<HTMLElement>);
              }
            } catch (err) {
              console.error('渲染 mermaid 图表失败:', err);
            }
            }
          }, 100);
        } catch (err) {
        console.error('加载 mermaid 失败:', err);
        }
    };

    loadMermaid();
  }, [safeContent]);

  // 自定义组件配置
  const components = {
    // 自定义图片渲染，增加懒加载和响应式
    img: ({ node, src, alt, ...props }: any) => {
      if (!src) {
        return <span className="text-red-500">[图片链接无效]</span>;
      }
      
        return (
        <span className="block my-4">
            <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            className="max-w-full h-auto rounded-md mx-auto"
              {...props}
            />
          {alt && <span className="block text-center text-sm text-gray-500 mt-2">{alt}</span>}
        </span>
      );
    },
    
    // 自定义列表项渲染
    li: ({ node, children, ...props }: any) => {
      // 检查是否为任务列表项
      const isTaskItem = 
        node.children[0]?.type === 'paragraph' && 
        node.children[0].children[0]?.type === 'text' && 
        /^\[[ x]\]/.test(node.children[0].children[0].value);
      
      if (isTaskItem) {
        const text = node.children[0].children[0].value;
        const checked = text.startsWith('[x]');
        const textContent = text.replace(/^\[[ x]\]\s*/, '');
        
        return (
          <li {...props} className="flex items-start py-0.5">
            <input 
              type="checkbox" 
              checked={checked} 
              disabled 
              className="mt-1.5 mr-2 h-4 w-4" 
              onChange={() => {}} 
            />
            <span>{textContent}</span>
            {children.slice(1)}
          </li>
        );
      }
      
      return <li {...props}>{children}</li>;
    },

    // 添加自定义链接渲染
    a: ({ node, href, children, ...props }: any) => {
      // 处理链接文本是URL的情况
      const isUrlText = children[0] && typeof children[0] === 'string' && 
        (children[0].startsWith('http://') || children[0].startsWith('https://'));
      
      return (
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-600 hover:text-blue-800 underline ${isUrlText ? 'break-all' : ''}`}
          {...props}
        >
          {children}
        </a>
      );
    },

    // 添加对行内代码的自定义渲染，支持文件扩展名高亮
    inlineCode: ({ node, children, ...props }: any) => {
      // 检查是否是文件扩展名格式（以.开头的短字符串）
      const isFileExtension = typeof children === 'string' && 
        /^\.[a-zA-Z0-9_\-+]+$/.test(String(children)) && String(children).length <= 10;
      
      if (isFileExtension) {
        return (
          <code 
            className="px-1.5 py-1 bg-gray-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded font-mono text-sm file-extension-highlight"
            {...props}
          >
            {children}
          </code>
        );
      }
      
      return (
        <code 
          className="px-1.5 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    }
  };

  // 动态样式，用于注入到页面
  const dynamicStyles = `
    .markdown-preview-wrapper .task-list-item {
      list-style-type: none;
      padding-left: 0;
    }
    
    .markdown-preview-wrapper .task-list {
      list-style-type: none;
      padding-left: 1.5rem;
    }
    
    .markdown-preview-wrapper h1,
    .markdown-preview-wrapper h2,
    .markdown-preview-wrapper h3,
    .markdown-preview-wrapper h4,
    .markdown-preview-wrapper h5,
    .markdown-preview-wrapper h6 {
      margin-top: 1.5em;
      margin-bottom: 0.75em;
          font-weight: 600;
      scroll-margin-top: 100px;
        }
    
    .markdown-preview-wrapper h1 {
      font-size: 2.25rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    
    .markdown-preview-wrapper h2 {
      font-size: 1.875rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.25rem;
        }
        
    .markdown-preview-wrapper h3 {
      font-size: 1.5rem;
        }
    
    .markdown-preview-wrapper h4 {
      font-size: 1.25rem;
    }
    
    .markdown-preview-wrapper h5 {
      font-size: 1.125rem;
        }
    
    .markdown-preview-wrapper h6 {
      font-size: 1rem;
      color: #6b7280;
        }
        
    .markdown-preview-wrapper blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
      color: #6b7280;
          font-style: italic;
        }
        
    .markdown-preview-wrapper pre {
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      background-color: #1e293b;
        }
    
    .markdown-preview-wrapper code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.9em;
        }
        
    .markdown-preview-wrapper table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
        }
    
    .markdown-preview-wrapper table th,
    .markdown-preview-wrapper table td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem 0.75rem;
        }
    
    .markdown-preview-wrapper table th {
      background-color: #f9fafb;
          font-weight: 600;
    }
    
    .markdown-preview-wrapper table tr:nth-child(even) {
      background-color: #f9fafb;
        }
    
    .markdown-preview-wrapper img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1.5rem auto;
        }
        
    .markdown-preview-wrapper p {
      margin: 1rem 0;
      line-height: 1.75;
        }
    
    .markdown-preview-wrapper ul,
    .markdown-preview-wrapper ol {
      margin: 1rem 0;
      padding-left: 2rem;
        }
    
    .markdown-preview-wrapper li {
          margin: 0.5rem 0;
        }
    
    .markdown-preview-wrapper hr {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 2rem 0;
        }
    
    /* 定制 admonition 样式 */
    .markdown-preview-wrapper .admonition {
      margin: 1.5rem 0;
      padding: 0.75rem 1rem;
      border-left: 4px solid #e5e7eb;
      border-radius: 0.25rem;
      background-color: #f9fafb;
    }
    
    .markdown-preview-wrapper .admonition.note {
      border-left-color: #60a5fa;
      background-color: #f0f9ff;
        }
    
    .markdown-preview-wrapper .admonition.info {
      border-left-color: #34d399;
          background-color: #ecfdf5;
    }
    
    .markdown-preview-wrapper .admonition.warning {
      border-left-color: #fbbf24;
      background-color: #fffbeb;
    }
    
    .markdown-preview-wrapper .admonition.danger {
      border-left-color: #ef4444;
      background-color: #fee2e2;
        }
        
    .markdown-preview-wrapper .admonition-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
        }
        
    .markdown-preview-wrapper .admonition.note .admonition-title {
          color: #1e40af;
        }
    
    .markdown-preview-wrapper .admonition.info .admonition-title {
      color: #047857;
    }
    
    .markdown-preview-wrapper .admonition.warning .admonition-title {
      color: #b45309;
    }
    
    .markdown-preview-wrapper .admonition.danger .admonition-title {
      color: #b91c1c;
    }
  `;

  // 如果内容为空，显示提示信息
  if (!safeContent) {
    return (
      <div className={`markdown-preview-empty ${className}`}>
        <div className="p-4 text-gray-500 italic">暂无内容可预览</div>
      </div>
    );
  }

  return (
    <>
      <style>{dynamicStyles}</style>
      <div ref={containerRef} className={`markdown-preview-wrapper prose prose-slate lg:prose-lg dark:prose-invert max-w-none ${className}`}>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
              <p className="font-bold mb-2">Markdown渲染失败</p>
              <p className="text-sm mb-2">显示原始内容</p>
              <pre className="bg-white p-3 text-sm border rounded overflow-auto whitespace-pre-wrap">
                {safeContent}
              </pre>
            </div>
          )}
        >
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeSlug, rehypeSanitize]}
          remarkPlugins={[remarkGfm, remarkToc, remarkUnwrapImages, remarkAdmonitions]}
          components={components}
        >
            {safeContent}
        </ReactMarkdown>
        </ErrorBoundary>
      </div>
    </>
  );
} 