'use client';

import React, { useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ErrorBoundary } from 'react-error-boundary';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  debug?: boolean;
}

/**
 * 提取文档中的标题
 */
function extractHeadings(markdown: string) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')  // 移除特殊字符
      .replace(/\s+/g, '-');     // 空格替换为连字符
    
    headings.push({ level, text, id });
  }
  
  return headings;
}

/**
 * 目录组件
 */
function TableOfContents({ headings }: { headings: { level: number; text: string; id: string }[] }) {
  if (headings.length === 0) {
    return null;
  }
  
  return (
    <div className="toc-container border rounded bg-gray-50 p-4 mb-4">
      <h3 className="font-bold text-lg mb-2">目录</h3>
      <ul className="toc-list">
        {headings.map((heading, index) => (
          <li 
            key={index} 
            className="my-1"
            style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
          >
            <a 
              href={`#${heading.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Mermaid图表渲染组件
 */
function MermaidRenderer({ code }: { code: string }) {
  const [svgCode, setSvgCode] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const mermaidId = React.useId();
  
  useEffect(() => {
    try {
      // 初始化mermaid配置
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
      });
      
      // 渲染图表
      mermaid.render(`mermaid-${mermaidId}`, code)
        .then((result) => {
          setSvgCode(result.svg);
          setError(null);
        })
        .catch((err) => {
          console.error('Mermaid图表渲染失败:', err);
          setError(`图表渲染失败: ${err.message || '未知错误'}`);
        });
    } catch (err) {
      console.error('Mermaid初始化失败:', err);
      setError(`图表引擎初始化失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [code, mermaidId]);
  
  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 rounded-md my-4">
        <p className="text-red-600 mb-2 font-medium">Mermaid图表错误</p>
        <pre className="text-sm overflow-auto p-2 bg-white border border-red-200 rounded">
          {error}
        </pre>
        <pre className="text-sm overflow-auto p-2 bg-white border border-red-200 rounded mt-2">
          {code}
        </pre>
      </div>
    );
  }
  
  if (!svgCode) {
    return (
      <div className="flex justify-center items-center h-24 border rounded-md bg-gray-50 my-4">
        <div className="text-gray-500">图表渲染中...</div>
      </div>
    );
  }
  
  return (
    <div className="mermaid-diagram my-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svgCode }} />
  );
}

/**
 * PlantUML图表渲染组件
 */
function PlantUMLRenderer({ code }: { code: string }) {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  useEffect(() => {
    // 简单编码PlantUML内容，实际项目中通常使用后端API
    try {
      // 这里使用PlantUML官方的在线服务
      // 实际使用时，推荐搭建自己的PlantUML服务器
      // 或使用后端API转换
      
      // 1. 简单编码PlantUML代码以在URL中使用
      const encoded = encodeURIComponent(code);
      
      // 2. 使用PlantUML的在线服务渲染图表
      // 注意：实际项目中应该调用自己的后端API，不要直接使用在线服务
      const plantumlUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
      
      setImageUrl(plantumlUrl);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('PlantUML编码失败:', err);
      setError(`PlantUML编码失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsLoading(false);
    }
  }, [code]);
  
  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 rounded-md my-4">
        <p className="text-red-600 mb-2 font-medium">PlantUML图表错误</p>
        <pre className="text-sm overflow-auto p-2 bg-white border border-red-200 rounded">
          {error}
        </pre>
        <pre className="text-sm overflow-auto p-2 bg-white border border-red-200 rounded mt-2">
          {code}
        </pre>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24 border rounded-md bg-gray-50 my-4">
        <div className="text-gray-500">图表渲染中...</div>
      </div>
    );
  }
  
  return (
    <div className="plantuml-diagram my-4 flex justify-center">
      <img 
        src={imageUrl} 
        alt="PlantUML Diagram" 
        className="max-w-full border rounded shadow-sm" 
        loading="lazy"
      />
      <div className="text-xs text-gray-500 mt-1 text-center">PlantUML图表</div>
    </div>
  );
}

/**
 * 提示块渲染组件
 */
const AdmonitionBlock = ({ children, type }: { children: React.ReactNode, type: string }) => {
  let title = '';
  let content = null;
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps = child.props as any; // 使用类型断言解决类型检查问题
      if (childProps.className === 'admonition-title') {
        title = childProps.children;
      } else if (childProps.className === 'admonition-content') {
        content = childProps.children;
      }
    }
  });
  
  let styles = 'border rounded-md p-4 my-4 ';
  let icon = '💡';
  
  switch (type.toLowerCase()) {
    case 'warning':
      styles += 'bg-yellow-50 border-yellow-200';
      icon = '⚠️';
      break;
    case 'important':
      styles += 'bg-red-50 border-red-200';
      icon = '❗';
      break;
    case 'info':
      styles += 'bg-blue-50 border-blue-200';
      icon = 'ℹ️';
      break;
    case 'tip':
    default:
      styles += 'bg-green-50 border-green-200';
      break;
  }
  
  return (
    <div className={styles}>
      <div className="flex items-center gap-2 mb-2 font-medium">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="ml-6">
        {content}
      </div>
    </div>
  );
}

/**
 * 处理Admonition块
 */
function processAdmonitions(content: string) {
  // 正则匹配admonition块语法: :::type\n内容\n:::
  const admonitionRegex = /:::(tip|warning|important|info)\n([\s\S]*?)\n:::/g;
  let match;
  let processedContent = content;
  
  // 替换admonition块为HTML代码，稍后通过rehypeRaw处理
  while ((match = admonitionRegex.exec(content)) !== null) {
    const [fullMatch, type, blockContent] = match;
    const replacement = `<div class="admonition admonition-${type}">
      <div class="admonition-title">${type}</div>
      <div class="admonition-content">${blockContent.trim()}</div>
    </div>`;
    
    processedContent = processedContent.replace(fullMatch, replacement);
  }
  
  return processedContent;
}

/**
 * Markdown渲染器组件
 * 使用react-markdown处理Markdown内容，避免使用依赖unified 10.x的Bytemd
 */
export function MarkdownRenderer({ content, className = '', debug = false }: MarkdownRendererProps) {
  // 确保内容是字符串
  const safeContent = useMemo(() => {
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
  }, [content]);
  
  // 提取标题并处理[toc]标记和admonition块
  const { processedContent, headings } = useMemo(() => {
    // 提取所有标题
    const extractedHeadings = extractHeadings(safeContent);
    
    // 检查内容是否包含[toc]标记
    const hasTocMarker = safeContent.includes('[toc]');
    
    // 处理Admonition块
    let processed = processAdmonitions(safeContent);
    
    // 如果有[toc]标记，移除它，在渲染时单独处理
    if (hasTocMarker) {
      processed = processed.replace(/\[toc\]/g, '');
    }
    
    return { 
      processedContent: processed, 
      headings: extractedHeadings,
      hasTocMarker: hasTocMarker
    };
  }, [safeContent]);
  
  // 调试输出
  React.useEffect(() => {
    if (debug) {
      console.log('[MarkdownRenderer] 渲染内容:', { 
        contentType: typeof content,
        safeContentType: typeof safeContent,
        contentLength: safeContent.length,
        headingsCount: headings.length,
        sample: safeContent.substring(0, 50) + (safeContent.length > 50 ? '...' : '')
      });
    }
  }, [content, safeContent, headings, debug]);
  
  // 组件配置
  const components = {
    // 代码块增强处理
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      const codeContent = String(children).trim();
      
      // 内联代码处理
      if (inline) {
        return (
          <code
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }
      
      // Mermaid图表处理
      if (lang === 'mermaid') {
        return <MermaidRenderer code={codeContent} />;
      }
      
      // PlantUML图表处理
      if (lang === 'plantuml') {
        return <PlantUMLRenderer code={codeContent} />;
      }
      
      // 普通代码块处理
      return (
        <div className="relative group">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded px-2 py-1 text-xs"
              onClick={() => {
                if (typeof children === 'string') {
                  navigator.clipboard.writeText(children.trim());
                }
              }}
            >
              复制
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={lang}
            PreTag="div"
            className="rounded-md !my-4"
            showLineNumbers={true}
            wrapLines={true}
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      );
    },
    
    // 图片增强处理
    img({ node, src, alt, ...props }: any) {
      return (
        <img 
          src={src}
          alt={alt || '图片'} 
          className="max-w-full h-auto rounded-md shadow-sm my-4"
          loading="lazy"
          {...props}
        />
      );
    },
    
    // 表格增强处理
    table({ node, ...props }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-300" {...props} />
        </div>
      );
    },
    
    // 表头增强处理
    th({ node, ...props }: any) {
      return (
        <th 
          className="bg-gray-100 border border-gray-300 px-4 py-2 text-left font-medium" 
          {...props} 
        />
      );
    },
    
    // 表格单元格增强处理
    td({ node, ...props }: any) {
      return (
        <td className="border border-gray-300 px-4 py-2" {...props} />
      );
    },
    
    // 链接增强处理
    a({ node, href, ...props }: any) {
      const isInternalLink = href?.startsWith('#');
      
      return (
        <a 
          href={href} 
          className="text-blue-600 hover:text-blue-800 hover:underline" 
          target={isInternalLink ? undefined : "_blank"}
          rel={isInternalLink ? undefined : "noopener noreferrer"}
          {...props} 
        />
      );
    },
    
    // Admonition块处理
    div({ node, className, children, ...props }: any) {
      if (className && className.includes('admonition')) {
        const typeMatch = className.match(/admonition-(\w+)/);
        const type = typeMatch ? typeMatch[1] : 'tip';
        
        return <AdmonitionBlock type={type}>{children}</AdmonitionBlock>;
      }
      
      return <div className={className} {...props}>{children}</div>;
    },
    
    // 列表项增强处理，支持任务列表
    li({ node, children, ...props }: any) {
      // 检查是否为任务列表项
      const firstChild = node.children?.[0];
      const firstChildValue = firstChild?.children?.[0]?.value;
      
      if (firstChild?.type === 'paragraph' && 
          typeof firstChildValue === 'string' && 
          /^\[[ x]\]/.test(firstChildValue)) {
        
        const checked = firstChildValue.startsWith('[x]');
        const textContent = firstChildValue.replace(/^\[[ x]\]\s*/, '');
        
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
    }
  };
  
  // 如果内容为空，显示提示信息
  if (!safeContent) {
    return (
      <div className={`markdown-content ${className}`}>
        <div className="p-4 text-gray-500 italic">暂无内容可预览</div>
      </div>
    );
  }
  
  return (
    <div className={`markdown-content ${className}`}>
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
        {/* 如果文档中有[toc]标记，显示目录 */}
        {safeContent.includes('[toc]') && <TableOfContents headings={headings} />}
        
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug, rehypeKatex]}
          components={components}
          className="prose prose-slate dark:prose-invert max-w-none"
        >
          {processedContent}
        </ReactMarkdown>
      </ErrorBoundary>
    </div>
  );
} 