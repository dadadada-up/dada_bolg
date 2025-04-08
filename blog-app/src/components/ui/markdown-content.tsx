'use client';

import { useEffect, useState } from 'react';
import { Mermaid } from './mermaid';
import BlogImage from './blog-image';

interface MarkdownContentProps {
  html: string;
}

export function MarkdownContent({ html }: MarkdownContentProps) {
  const [processedHtml, setProcessedHtml] = useState(html);
  const [mermaidDiagrams, setMermaidDiagrams] = useState<Array<{id: string, content: string}>>([]);
  const [images, setImages] = useState<Array<{src: string, alt: string, caption?: string, id: string}>>([]);

  useEffect(() => {
    // 提取所有mermaid图表和处理图片链接
    const diagrams: Array<{id: string, content: string}> = [];
    const extractedImages: Array<{src: string, alt: string, caption?: string, id: string}> = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 处理mermaid图表
    const mermaidElements = tempDiv.querySelectorAll('.mermaid-diagram');
    mermaidElements.forEach((el, index) => {
      const content = el.getAttribute('data-diagram');
      if (content) {
        const id = `mermaid-diagram-${index}`;
        diagrams.push({
          id,
          content: decodeURIComponent(content)
        });
        // 替换为占位符
        el.outerHTML = `<div id="${id}"></div>`;
      }
    });

    // 处理普通图片链接
    const imgElements = tempDiv.querySelectorAll('img.markdown-image');
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || '';
      const caption = img.getAttribute('data-caption') || undefined;
      
      if (src) {
        const id = `markdown-image-${index}`;
        extractedImages.push({
          src,
          alt,
          caption,
          id
        });
        // 替换为占位符
        img.outerHTML = `<div id="${id}"></div>`;
      }
    });
    
    setMermaidDiagrams(diagrams);
    setImages(extractedImages);
    setProcessedHtml(tempDiv.innerHTML);

    // 增强表格 - 给所有表格添加样式和响应式包装
    setTimeout(() => {
      const tables = document.querySelectorAll('.markdown-content table, .prose table, .markdown-table');
      tables.forEach(table => {
        // 添加Tailwind表格样式
        table.classList.add('min-w-full', 'border-collapse', 'text-sm', 'my-4');
        
        // 如果表格没有被包装，创建一个响应式的包装器
        if (!table.parentElement?.classList.contains('overflow-x-auto')) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('overflow-x-auto', 'my-6', 'border', 'border-gray-200', 'rounded-md');
          
          // 将表格包装在响应式容器中
          table.parentNode?.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
        
        // 设置表头样式
        const headers = table.querySelectorAll('thead th');
        headers.forEach(header => {
          header.classList.add('border', 'border-gray-300', 'bg-gray-100', 'px-4', 'py-2', 'text-left', 'font-medium');
        });
        
        // 设置表格单元格样式
        const cells = table.querySelectorAll('tbody td');
        cells.forEach(cell => {
          cell.classList.add('border', 'border-gray-300', 'px-4', 'py-2');
        });
      });
    }, 100);
  }, [html]);

  return (
    <>
      <style jsx global>{`
        .markdown-content img, .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .markdown-content table, .prose table, .markdown-table {
          width: 100%;
          margin: 1.5rem 0;
          border-collapse: collapse;
        }
        .markdown-content th, .prose th, .markdown-table th {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          border: 1px solid #e5e7eb;
        }
        .markdown-content td, .prose td, .markdown-table td {
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
        }
        .markdown-content tr:nth-child(even), .prose tr:nth-child(even), .markdown-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `}</style>
      <div
        className="markdown-content prose lg:prose-xl dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
      
      {/* 渲染所有Mermaid图表 */}
      {mermaidDiagrams.map(diagram => (
        <Mermaid 
          key={diagram.id} 
          chart={diagram.content}
          targetId={diagram.id}
        />
      ))}

      {/* 渲染所有图片 */}
      {images.map(image => (
        <BlogImage
          key={image.id}
          src={image.src}
          alt={image.alt}
          caption={image.caption}
          targetId={image.id}
        />
      ))}
    </>
  );
}

export default MarkdownContent; 