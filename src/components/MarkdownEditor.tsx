'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkToc from 'remark-toc';
import remarkUnwrapImages from 'remark-unwrap-images';
import rehypeSlug from 'rehype-slug';
import remarkAdmonitions from '@/lib/remark-admonitions';
import { ImageUploadButton } from './markdown-editor/image-upload-button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  postId?: number;
}

export function MarkdownEditor({ value, onChange, postId }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  
  // 处理文本区域选择变化
  const handleSelectionChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelectionStart(target.selectionStart);
    setSelectionEnd(target.selectionEnd);
  };
  
  // 在光标位置插入文本
  const insertText = (textToInsert: string) => {
    const newValue = 
      value.substring(0, selectionStart) + 
      textToInsert + 
      value.substring(selectionEnd);
    
    onChange(newValue);
    
    // 设置新的光标位置
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const newPosition = selectionStart + textToInsert.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };
  
  // 处理图片插入
  const handleImageInserted = (imageUrl: string) => {
    const imageMarkdown = `![图片](${imageUrl})`;
    insertText(imageMarkdown);
  };

  // 自定义组件渲染
  const components = {
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

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex justify-between items-center">
        <div className="flex space-x-1">
          <ImageUploadButton 
            onImageInserted={handleImageInserted}
            postId={postId}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>
      
      {showPreview ? (
        <div className="p-4 prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkToc, remarkUnwrapImages, remarkAdmonitions]}
            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeSlug]}
            components={components}
          >
            {value}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          className="w-full h-96 p-4 focus:outline-none"
          placeholder="使用 Markdown 语法编写文章内容..."
        />
      )}
    </div>
  );
} 