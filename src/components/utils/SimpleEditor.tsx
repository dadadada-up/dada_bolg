'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TextDiagramModal } from './TextDiagramModal';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  className?: string;
  placeholder?: string;
}

interface ToolItem {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  shortcut?: string;
  category?: string;
}

interface ToolGroup {
  name: string;
  tools: ToolItem[];
  priority: number; // 1: 常用, 2: 次常用, 3: 不常用
  icon?: string;
}

/**
 * 简单可靠的Markdown编辑器组件，不依赖复杂库
 */
export function SimpleEditor({ 
  value, 
  onChange, 
  height = 500,
  className = '',
  placeholder = '在此输入Markdown内容...'
}: SimpleEditorProps) {
  // 确保内容是字符串
  const initialContent = typeof value === 'string' ? value : '';
  const [content, setContent] = useState<string>(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 工具栏状态管理
  const [showAllTools, setShowAllTools] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 文本绘图对话框状态
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  
  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // 同步外部值变化
  useEffect(() => {
    if (typeof value === 'string' && value !== content) {
      setContent(value);
    }
  }, [value]);
  
  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  };
  
  // 处理Tab键，在光标位置插入制表符而不是切换焦点
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 在光标位置插入两个空格
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      
      // 更新内容
      setContent(newValue);
      onChange(newValue);
      
      // 恢复光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  // 在光标位置插入Markdown语法
  const insertMarkdown = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let newText: string;
    let newCursorPos: number;
    
    // 如果有选中文本，在选中文本前后添加标记
    if (start !== end) {
      const selectedText = content.substring(start, end);
      newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
      newCursorPos = end + prefix.length + suffix.length;
    } else {
      // 如果没有选中文本，插入带有占位符的标记
      newText = content.substring(0, start) + prefix + placeholder + suffix + content.substring(end);
      newCursorPos = start + prefix.length + placeholder.length;
    }
    
    // 更新内容
    setContent(newText);
    onChange(newText);
    
    // 恢复焦点并设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  };
  
  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // 显示上传占位符
      const placeholderText = `![上传中...](正在上传 ${file.name})`;
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const newText = content.substring(0, cursorPos) + placeholderText + content.substring(cursorPos);
      setContent(newText);
      onChange(newText);
      
      // 创建表单数据
      const formData = new FormData();
      formData.append('image', file);
      
      // 发送上传请求
      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('图片上传失败');
      }
      
      const data = await response.json();
      const imageUrl = data.url;
      
      // 替换占位符为实际图片链接
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      const finalText = newText.replace(placeholderText, imageMarkdown);
      setContent(finalText);
      onChange(finalText);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      // 清空文件输入
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  // 处理插入图表
  const handleInsertDiagram = (code: string, language: string) => {
    // 根据传入的语言确定markdown语法
    const markdownCode = `\`\`\`${language}\n${code}\n\`\`\``;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // 插入图表代码
    const newText = content.substring(0, start) + markdownCode + content.substring(end);
    setContent(newText);
    onChange(newText);
    
    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + markdownCode.length;
      textarea.selectionStart = textarea.selectionEnd = newPosition;
    }, 0);
  };
  
  // 工具组定义
  const toolGroups: ToolGroup[] = [
    {
      name: '格式',
      priority: 1,
      icon: 'B',
      tools: [
        { icon: <span className="font-bold">B</span>, title: '粗体文本', shortcut: 'Ctrl+B', action: () => insertMarkdown('**', '**', '粗体文本') },
        { icon: <span className="italic">I</span>, title: '斜体文本', shortcut: 'Ctrl+I', action: () => insertMarkdown('*', '*', '斜体文本') },
        { icon: <span className="line-through">S</span>, title: '删除线文本', action: () => insertMarkdown('~~', '~~', '删除线文本') },
      ]
    },
    {
      name: '标题',
      priority: 1,
      icon: 'H',
      tools: [
        { icon: <span className="font-bold">H1</span>, title: '一级标题', action: () => insertMarkdown('# ', '', '一级标题') },
        { icon: <span className="font-bold">H2</span>, title: '二级标题', action: () => insertMarkdown('## ', '', '二级标题') },
        { icon: <span className="font-bold">H3</span>, title: '三级标题', action: () => insertMarkdown('### ', '', '三级标题') },
      ]
    },
    {
      name: '列表',
      priority: 1,
      icon: '·',
      tools: [
        { icon: '•', title: '无序列表', action: () => insertMarkdown('- ', '', '列表项') },
        { icon: '1.', title: '有序列表', action: () => insertMarkdown('1. ', '', '列表项') },
        { icon: '☑', title: '任务列表', action: () => insertMarkdown('- [ ] ', '', '待办事项') },
      ]
    },
    {
      name: '插入',
      priority: 2,
      icon: '📌',
      tools: [
        { icon: '🔗', title: '插入链接', action: () => insertMarkdown('[', '](https://example.com)', '链接文本') },
        { icon: '📷', title: '插入图片', action: () => insertMarkdown('![', '](https://example.com/image.jpg)', '图片描述') },
        { 
          icon: <span className="text-xs font-mono bg-gray-200 px-1 rounded">{"{ }"}</span>, 
          title: '插入代码块', 
          action: () => insertMarkdown('```\n', '\n```', 'console.log("Hello World")') 
        },
        { icon: <span className="font-mono">`</span>, title: '插入行内代码', action: () => insertMarkdown('`', '`', '代码') },
        { icon: '📤', title: '上传图片', category: '上传', action: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageUpload(event);
          };
          input.click();
        }},
      ]
    },
    {
      name: '区块',
      priority: 2,
      icon: '▭',
      tools: [
        { icon: '❝', title: '引用块', action: () => insertMarkdown('> ', '', '引用文本') },
        { icon: '⎯', title: '分割线', action: () => insertMarkdown('\n\n---\n\n', '', '') },
        { icon: '⊞', title: '表格', action: () => insertMarkdown('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n| 内容 | 内容 | 内容 |\n', '', '') },
      ]
    },
    {
      name: '图表',
      priority: 3,
      icon: '📊',
      tools: [
        { 
          icon: '📊', 
          title: '插入文本绘图', 
          category: '图表',
          action: () => setShowDiagramModal(true)
        },
        { 
          icon: '📊', 
          title: 'Mermaid流程图', 
          category: '图表',
          action: () => insertMarkdown('```mermaid\ngraph TD;\n', '\n```', '    A[开始] --> B[处理];\n    B --> C{判断};\n    C -->|是| D[处理1];\n    C -->|否| E[处理2];\n    D --> F[结束];\n    E --> F;') 
        },
        { 
          icon: '📐', 
          title: 'PlantUML图', 
          category: '图表',
          action: () => insertMarkdown('```plantuml\n', '\n```', '@startuml\nskinparam handwritten true\n\nactor 用户\nactor 管理员\ndatabase 数据库\n\n用户 -> (登录)\n用户 -> (查看文章)\n管理员 --> (管理文章)\n管理员 --> (管理用户)\n\n(管理文章) -> 数据库\n(管理用户) -> 数据库\n@enduml') 
        },
      ]
    },
    {
      name: '高级',
      priority: 3,
      icon: '✨',
      tools: [
        { 
          icon: 'Σ', 
          title: '行内数学公式', 
          category: '数学',
          action: () => insertMarkdown('$', '$', 'E=mc^2') 
        },
        { 
          icon: '∑', 
          title: '块级数学公式', 
          category: '数学',
          action: () => insertMarkdown('$$\n', '\n$$', 'f(x) = \\int_{-\\infty}^\\infty\\hat f(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi') 
        },
        { 
          icon: '💡', 
          title: '提示信息块', 
          category: '提示块',
          action: () => insertMarkdown('\n:::tip\n', '\n:::\n', '这是一个提示信息') 
        },
        { 
          icon: '⚠️', 
          title: '警告信息块', 
          category: '提示块',
          action: () => insertMarkdown('\n:::warning\n', '\n:::\n', '这是一个警告信息') 
        },
        { 
          icon: '❗', 
          title: '重要信息块', 
          category: '提示块',
          action: () => insertMarkdown('\n:::important\n', '\n:::\n', '这是一个重要信息') 
        },
        { 
          icon: 'ℹ️', 
          title: '普通信息块', 
          category: '提示块',
          action: () => insertMarkdown('\n:::info\n', '\n:::\n', '这是一个普通信息') 
        },
        { 
          icon: '📋', 
          title: '插入目录标记', 
          category: '其他',
          action: () => insertMarkdown('[toc]\n\n', '', '') 
        },
      ]
    },
    {
      name: 'Emoji',
      priority: 3,
      icon: '😊',
      tools: [
        { icon: '😊', title: '笑脸表情', category: '表情', action: () => insertMarkdown('', '', '😊') },
        { icon: '👍', title: '点赞表情', category: '表情', action: () => insertMarkdown('', '', '👍') },
        { icon: '❤️', title: '爱心表情', category: '表情', action: () => insertMarkdown('', '', '❤️') },
        { icon: '🎉', title: '庆祝表情', category: '表情', action: () => insertMarkdown('', '', '🎉') },
        { icon: '🚀', title: '火箭表情', category: '表情', action: () => insertMarkdown('', '', '🚀') },
      ]
    },
  ];

  // 点击工具栏外关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-toggle')) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 渲染工具按钮
  const renderToolButton = (tool: ToolItem, index: number) => (
    <button
      key={index}
      type="button"
      aria-label={tool.title}
      onClick={tool.action}
      className="tool-button w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors relative group"
      title={tool.title}
    >
      {tool.icon}
      <div className="tooltip">
        <div className="tooltip-title">{tool.title}</div>
        {tool.shortcut && <div className="tooltip-shortcut">{tool.shortcut}</div>}
      </div>
    </button>
  );

  // 渲染下拉菜单
  const renderDropdown = (group: ToolGroup) => (
    <div className="relative" key={group.name}>
      <button
        type="button"
        onClick={() => setActiveDropdown(activeDropdown === group.name ? null : group.name)}
        className={`dropdown-toggle flex items-center gap-1 px-2 py-1 rounded ${activeDropdown === group.name ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
      >
        <span>{group.icon}</span>
        {!isMobile && <span>{group.name}</span>}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {activeDropdown === group.name && (
        <div className="dropdown-menu absolute z-10 mt-1 bg-white border rounded shadow-lg py-1 min-w-[180px]">
          <div className="p-1 border-b text-xs font-medium text-gray-500">{group.name}</div>
          <div className="p-1 grid grid-cols-3 gap-1">
            {group.tools.map((tool, index) => renderToolButton(tool, index))}
          </div>
        </div>
      )}
    </div>
  );

  // 分组工具栏并渲染
  const renderToolbar = () => {
    // 筛选优先级工具组
    const primaryTools = toolGroups.filter(group => group.priority === 1);
    const secondaryTools = toolGroups.filter(group => group.priority === 2);
    const advancedTools = toolGroups.filter(group => group.priority === 3);
    
    return (
      <div className="toolbar bg-gray-100 p-2 border border-gray-300 rounded-t-md">
        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          {/* 常用工具组 - 直接显示按钮 */}
          {primaryTools.map(group => (
            <div key={group.name} className="tool-group border-r pr-1 mr-1 last:border-r-0">
              <div className="tool-group-content flex flex-wrap gap-1">
                {group.tools.map((tool, index) => renderToolButton(tool, index))}
              </div>
            </div>
          ))}
          
          {/* 次常用工具组 - 正常显示 */}
          {!isMobile && secondaryTools.map(group => (
            <div key={group.name} className="tool-group border-r pr-1 mr-1 last:border-r-0">
              <div className="tool-group-content flex flex-wrap gap-1">
                {group.tools.map((tool, index) => renderToolButton(tool, index))}
              </div>
            </div>
          ))}
          
          {/* 移动端合并次常用工具为下拉菜单 */}
          {isMobile && secondaryTools.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'secondary' ? null : 'secondary')}
                className={`dropdown-toggle flex items-center gap-1 px-2 py-1 rounded ${activeDropdown === 'secondary' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              >
                <span>+</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'secondary' && (
                <div className="dropdown-menu absolute z-10 mt-1 bg-white border rounded shadow-lg p-1 min-w-[180px]">
                  {secondaryTools.map(group => (
                    <div key={group.name} className="mb-2 last:mb-0">
                      <div className="text-xs font-medium text-gray-500 mb-1">{group.name}</div>
                      <div className="grid grid-cols-3 gap-1">
                        {group.tools.map((tool, index) => renderToolButton(tool, index))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 高级工具组 - 使用下拉菜单 */}
          {advancedTools.map(group => renderDropdown(group))}
          
          {/* 工具栏显示/隐藏切换按钮 */}
          {advancedTools.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllTools(!showAllTools)}
              className="ml-auto px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {showAllTools ? '简化工具栏' : '显示更多工具'}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`simple-editor ${className}`}>
      {/* 文本绘图对话框 */}
      <TextDiagramModal 
        isOpen={showDiagramModal}
        onClose={() => setShowDiagramModal(false)}
        onInsert={handleInsertDiagram}
      />
      
      <style jsx global>{`
        /* 工具栏样式 */
        .tool-button {
          position: relative;
          font-size: 14px;
        }
        
        /* 工具提示样式 */
        .tool-button .tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          text-align: center;
          border-radius: 4px;
          padding: 5px 8px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
          width: max-content;
          max-width: 200px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        .tool-button .tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
        }
        
        .tool-button:hover .tooltip {
          opacity: 1;
          visibility: visible;
        }
        
        /* 修复工具提示被遮挡问题 */
        .dropdown-menu .tool-button .tooltip {
          bottom: auto;
          top: calc(100% + 8px);
          z-index: 10000;
        }
        
        .dropdown-menu .tool-button .tooltip::after {
          top: auto;
          bottom: 100%;
          border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
        }
        
        /* 顶部工具栏按钮的提示应该向上 */
        .toolbar > div > .tool-group .tool-button .tooltip {
          bottom: calc(100% + 10px);
          top: auto;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
        }
        
        .toolbar > div > .tool-group .tool-button .tooltip::after {
          bottom: auto;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
        }
        
        /* 为特定位置的工具栏按钮添加偏移，避免被导航栏遮挡 */
        .toolbar .tool-group:nth-child(1) .tool-button .tooltip,
        .toolbar .tool-group:nth-child(2) .tool-button .tooltip,
        .toolbar .tool-group:nth-child(3) .tool-button .tooltip {
          transform: translateX(-50%) translateY(-10px);
        }
        
        /* 为下拉菜单项目提供侧向提示，避免重叠 */
        .dropdown-menu .tool-button:hover .tooltip {
          transform: translateX(-50%) translateY(0);
        }

        /* 增加提示框的z-index确保显示在最上层 */
        .tooltip {
          z-index: 10000 !important; 
        }
        
        .tooltip-title {
          font-weight: 500;
        }
        
        .tooltip-shortcut {
          opacity: 0.8;
          font-size: 10px;
          margin-top: 2px;
        }
        
        /* 增强分组视觉效果 */
        .tool-group {
          position: relative;
        }
        
        /* 下拉菜单样式 */
        .dropdown-menu {
          max-height: 350px;
          overflow-y: auto;
        }
        
        /* 响应式调整 */
        @media (max-width: 640px) {
          .tool-button {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
        }
        
        /* 确保在高级编辑器中工具提示也正确显示 */
        .advanced-editor .editor-toolbar {
          position: relative;
          z-index: 50;
        }
        
        .advanced-editor .simple-editor .tool-button .tooltip {
          z-index: 9999;
        }
        
        /* 避免提示被编辑器导航栏遮挡 */
        .advanced-editor .editor-toolbar + div .tool-button .tooltip {
          transform: translateX(-50%) translateY(-10px);
        }
        
        .advanced-editor .simple-editor .tool-button:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        
        /* 当工具提示位于页面顶部时，将其显示在按钮下方 */
        @media (max-height: 200px) {
          .toolbar > div > .tool-group .tool-button .tooltip {
            bottom: auto;
            top: calc(100% + 10px);
            z-index: 10000;
          }
          
          .toolbar > div > .tool-group .tool-button .tooltip::after {
            top: auto;
            bottom: 100%;
            border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
          }
        }
      `}</style>
      
      {/* 渲染工具栏 */}
      {renderToolbar()}
      
      {/* 文本编辑区域 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 rounded-b-md"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '200px',
        }}
        placeholder={placeholder}
      />
      
      {/* 编辑器底部信息 */}
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <div>字数: {content.length}</div>
        <div>行数: {(content.match(/\n/g) || []).length + 1}</div>
      </div>
    </div>
  );
} 