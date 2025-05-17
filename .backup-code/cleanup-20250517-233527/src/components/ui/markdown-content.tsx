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
      console.log('[MarkdownContent] 开始处理表格和admonition');
      
      // 处理表格
      enhanceTables();
      
      // 确保admonition区块格式正确
      enhanceAdmonitions();
      
    }, 100);
  }, [html]);
  
  // 增强表格样式和结构
  const enhanceTables = () => {
    // 查找所有表格 - 包括markdown-table、prose table以及普通table
    const tables = document.querySelectorAll('.markdown-content table, .prose table, .markdown-table, table:not(.markdown-table):not(.prose table)');
    console.log('[MarkdownContent] 找到表格数量:', tables.length);
    
    tables.forEach((table, index) => {
      console.log(`[MarkdownContent] 处理表格 #${index+1}`);
      
      // 添加Tailwind表格样式
      table.classList.add('min-w-full', 'border-collapse', 'text-sm', 'my-4', 'markdown-table');
      
      // 如果表格没有被包装，创建一个响应式的包装器
      if (!table.parentElement?.classList.contains('overflow-x-auto')) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('overflow-x-auto', 'my-6', 'border', 'border-gray-200', 'rounded-md');
        
        // 将表格包装在响应式容器中
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        console.log('[MarkdownContent] 添加表格响应式包装');
      }
      
      // 设置表头样式
      const headers = table.querySelectorAll('thead th, th');
      headers.forEach(header => {
        header.classList.add('border', 'border-gray-300', 'bg-gray-100', 'px-4', 'py-2', 'text-left', 'font-medium');
      });
      
      // 设置表格单元格样式
      const cells = table.querySelectorAll('tbody td, td:not(th)');
      cells.forEach(cell => {
        cell.classList.add('border', 'border-gray-300', 'px-4', 'py-2');
      });
      
      // 设置表格行的样式
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, rowIndex) => {
        row.classList.add('hover:bg-gray-50');
        // 斑马条纹样式
        if (rowIndex % 2 === 1) {
          row.classList.add('bg-gray-50');
        }
      });
    });
  };
  
  // 增强admonition区块
  const enhanceAdmonitions = () => {
    const admonitions = document.querySelectorAll('.admonition');
    console.log('[MarkdownContent] 找到admonition数量:', admonitions.length);
    
    admonitions.forEach((adm, index) => {
      console.log(`[MarkdownContent] 处理admonition #${index+1}`);
      
      // 确保admonition有正确的样式
      adm.classList.add('my-6', 'p-6', 'border', 'rounded-lg');
      
      // 处理admonition内容
      const content = adm.querySelector('.admonition-content');
      if (content) {
        // 确保admonition内容中的文本被包裹在段落中
        const directTextNodes = Array.from(content.childNodes).filter(
          node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );
        
        directTextNodes.forEach(textNode => {
          if (textNode.textContent?.trim()) {
            const p = document.createElement('p');
            p.textContent = textNode.textContent;
            textNode.parentNode?.replaceChild(p, textNode);
          }
        });
      }
    });
  };

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
        .markdown-content .admonition, .prose .admonition {
          margin: 1.5rem 0;
          padding: 1rem;
          border-radius: 0.5rem;
          border-width: 1px;
        }
        .markdown-content .admonition-header, .prose .admonition-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .markdown-content .admonition-icon, .prose .admonition-icon {
          margin-right: 0.5rem;
        }
        .markdown-content .admonition-content, .prose .admonition-content {
          font-size: 0.95rem;
        }
        .markdown-content .admonition-content p, .prose .admonition-content p {
          margin: 0.5rem 0;
        }
        .markdown-content .admonition.info, .prose .admonition.info {
          background-color: #ebf5ff;
          border-color: #a3bffa;
          color: #1e3a8a;
        }
        .markdown-content .admonition.warning, .prose .admonition.warning {
          background-color: #fffbeb;
          border-color: #fcd34d;
          color: #92400e;
        }
        .markdown-content .admonition.tip, .prose .admonition.tip {
          background-color: #ecfdf5;
          border-color: #84e1bc;
          color: #065f46;
        }
        .markdown-content .admonition.note, .prose .admonition.note {
          background-color: #f3f4f6;
          border-color: #d1d5db;
          color: #1f2937;
        }
        .markdown-content .admonition.caution, .prose .admonition.caution {
          background-color: #fff1f2;
          border-color: #fda4af;
          color: #9f1239;
        }
      `}</style>
      <div
        className="markdown-content prose prose-slate lg:prose-lg dark:prose-invert max-w-none"
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