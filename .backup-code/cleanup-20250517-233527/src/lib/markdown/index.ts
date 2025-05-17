import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrismPlus from 'rehype-prism-plus';
import { toString } from 'mdast-util-to-string';
import rehypeFormat from 'rehype-format';
import remarkAdmonitions from '@/lib/markdown/remark-admonitions';

// 基本接口
interface ImageNode {
  type: 'element';
  tagName: 'img';
  properties: {
    src: string;
    alt?: string;
    title?: string;
    [key: string]: any;
  };
  children: any[];
}

// 生成文章的目录
export function generateTableOfContents(markdown: string) {
  // 提取所有标题的正则表达式
  const regex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; slug: string }> = [];
  let match;

  // 遍历所有匹配的标题
  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    headings.push({ level, text, slug });
  }

  return headings;
}

// 提取文章的前200字作为摘要
export function extractExcerpt(markdown: string, maxLength = 200): string {
  // 移除Markdown的前置信息（如果有的话）
  let content = markdown;
  const frontMatterRegex = /^---\n[\s\S]*?\n---\n/;
  if (frontMatterRegex.test(content)) {
    content = content.replace(frontMatterRegex, '');
  }

  // 移除Markdown语法
  content = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 替换链接为文本
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // 移除代码块和行内代码
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体
    .replace(/~~(.*?)~~/g, '$1') // 移除删除线
    .replace(/>\s*(.*)/g, '$1') // 移除引用
    .replace(/\n+/g, ' ') // 将多个换行替换为空格
    .replace(/\s+/g, ' ') // 将多个空格替换为一个
    .trim();

  if (content.length <= maxLength) {
    return content;
  }

  // 截取到maxLength长度，并确保不会截断单词
  const truncated = content.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

// 将Markdown转换为HTML
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    // 调试信息
    console.log("[markdownToHtml] 处理Markdown内容, 长度:", markdown.length);
    
    // 首先移除YAML前置内容，确保不会被渲染到HTML中
    let contentToProcess = markdown;
    const hasFrontMatter = contentToProcess.trim().startsWith('---');
    if (hasFrontMatter) {
      const secondSeparatorIndex = contentToProcess.indexOf('---', 3);
      if (secondSeparatorIndex > 0) {
        contentToProcess = contentToProcess.substring(secondSeparatorIndex + 3).trim();
      }
    }
    
    // 修复表格前后的格式
    const fixedMarkdown = preprocessMarkdown(contentToProcess);
    
    console.log("[markdownToHtml] 检查前处理后内容是否包含表格:",
      fixedMarkdown.includes("|"),
      fixedMarkdown.includes("| --- |")  
    );

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm) // 启用GFM扩展（表格、任务列表等）
      .use(remarkAdmonitions) // 添加对:::info等语法的支持
      .use(remarkRehype, { allowDangerousHtml: true }) // 允许传递HTML
      .use(rehypeRaw) // 解析HTML
      .use(rehypeSanitize) // 净化HTML
      .use(rehypeSlug) // 为标题添加id
      .use(rehypeAutolinkHeadings) // 为标题添加链接
      .use(rehypePrismPlus) // 使用Prism高亮代码
      .use(rehypeFormat) // 格式化HTML
      .use(rehypeStringify) // 转换为字符串
      .process(fixedMarkdown);

    // 后处理HTML，增强表格渲染
    let resultHtml = enhanceHtml(result.toString());
    
    console.log("[markdownToHtml] 处理完成，检查结果是否包含表格标签:", 
      resultHtml.includes("<table"), 
      resultHtml.includes("<th"), 
      resultHtml.includes("<td")
    );
    
    return resultHtml;
  } catch (error) {
    console.error('Markdown转换失败:', error);
    // 简单的错误处理，返回原始Markdown包装在pre标签中
    return `<pre class="markdown-error">${markdown}</pre>`;
  }
}

// 预处理Markdown内容，修复常见格式问题
function preprocessMarkdown(content: string): string {
  return content
    // 修复标题中数字序号的转义问题
    .replace(/^(#{1,6})\s+(\d+)\\\.(\s+.+)$/gm, '$1 $2.$3')
    // 修复列表项中数字序号的转义问题
    .replace(/^(\s*)(\d+)\\\.(\s+.+)$/gm, '$1$2.$3')
    // 确保代码块前后有足够的空行
    .replace(/```(\w+)\n/g, '\n```$1\n')
    .replace(/\n```\n/g, '\n\n```\n')
    // 确保`+`列表项被正确处理
    .replace(/^(\s*)\+\s+/gm, '$1- ')
    // 确保admonition块前后有空行
    .replace(/(^|\n):::/g, '\n\n:::')
    .replace(/:::(\s*)(\n|$)/g, ':::\n\n')
    // 修复表格前后缺少换行符的问题
    .replace(/\n\|\s/g, '\n\n| ')
    .replace(/\|\n([^|])/g, '|\n\n$1')
    // 确保表格行前后有空行
    .replace(/(^|\n)(\|.+\|)(\n|$)/g, '$1\n$2\n$3')
    // 确保表格分隔行格式正确
    .replace(/(\|\s*[-:]+\s*\|)/g, '\n$1\n')
    // 确保表格每行末尾有分隔符 (修复不使用lookbehind)
    .replace(/^(\|.+)$/gm, (match) => match.endsWith('|') ? match : match + '|')
    // 修复表格分隔行的格式 (修复不使用lookbehind)
    .replace(/^(\|[-:\s]+)$/gm, (match) => match.endsWith('|') ? match : match + '|')
    // 确保表格后面内容前有空行
    .replace(/\|[\s]*\n([^\s|])/g, '|\n\n$1');
}

// 增强HTML输出，特别是处理表格
function enhanceHtml(html: string): string {
  // 检查是否有表格需要处理
  if (!html.includes('<table')) {
    return html;
  }
  
  // 为表格添加样式类和响应式包装
  let enhancedHtml = html
    // 添加表格样式类
    .replace(/<table>/g, '<table class="markdown-table min-w-full border-collapse">')
    
    // 确保表格被包装在响应式容器中
    .replace(/<table class="[^"]*">/g, 
      '<div class="overflow-x-auto my-6 border border-gray-200 rounded-md"><table class="markdown-table min-w-full border-collapse">')
    .replace(/<\/table>/g, '</table></div>')
    
    // 确保表头和单元格都有正确的样式
    .replace(/<th>/g, '<th class="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-medium">')
    .replace(/<td>/g, '<td class="border border-gray-300 px-4 py-2">');
  
  // 确保Admonition区块正确渲染 - 修复正则表达式兼容性问题
  enhancedHtml = enhancedHtml.replace(/<div class="admonition-content">([\s\S]*?)<\/div>/g, (match, content) => {
    // 如果内容是一个段落，确保它有正确的格式
    if (content.trim() && !content.trim().startsWith('<')) {
      return `<div class="admonition-content"><p>${content.trim()}</p></div>`;
    }
    return match;
  });
  
  return enhancedHtml;
}

// 提取文章的封面图片
export function extractCoverImage(markdown: string): string | null {
  // 尝试从Markdown中提取第一张图片
  const imageRegex = /!\[(.*?)\]\((.*?)\)/;
  const match = markdown.match(imageRegex);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

// 计算文章的字数统计信息
export function calculateWordCount(markdown: string) {
  // 移除Markdown的前置信息（如果有的话）
  let content = markdown;
  const frontMatterRegex = /^---\n[\s\S]*?\n---\n/;
  if (frontMatterRegex.test(content)) {
    content = content.replace(frontMatterRegex, '');
  }

  // 移除Markdown语法和图片
  const text = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // 移除代码块和行内代码
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 替换链接为文本
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体
    .replace(/~~(.*?)~~/g, '$1') // 移除删除线
    .replace(/>\s*(.*)/g, '$1') // 移除引用
    .trim();

  // 计算字符数（不包括空格）
  const characterCount = text.replace(/\s+/g, '').length;
  
  // 计算中文字数（按字符计算，不按空格分割）
  // 中文文本不像英文那样以空格分词，所以直接计算非空白字符
  const wordCount = text.replace(/\s+/g, '').length;
  
  // 假设平均阅读速度为每分钟300个中文字
  const readingTime = Math.ceil(wordCount / 300);
  
  return {
    wordCount,
    characterCount,
    readingTime: Math.max(1, readingTime) // 至少1分钟
  };
}

// 提取文章的阅读时间（以分钟为单位）- 保留向后兼容
export function calculateReadingTime(markdown: string): number {
  const { readingTime } = calculateWordCount(markdown);
  return readingTime;
}

// 提取所有图片并进行处理
export function extractImages(markdown: string): { alt: string; src: string }[] {
  const images: { alt: string; src: string }[] = [];
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    const alt = match[1] || '';
    const src = match[2] || '';
    
    if (src) {
      images.push({ alt, src });
    }
  }
  
  return images;
}

// 使图片路径适应不同的环境
export function normalizeImagePath(src: string): string {
  // 如果路径已经是完整的URL，则直接返回
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // 对于语雀的图片使用代理
    if (src.includes('cdn.nlark.com') || src.includes('yuque.com')) {
      return `/api/proxy?url=${encodeURIComponent(src)}`;
    }
    return src;
  }
  
  // 如果路径是相对路径，则转换为绝对路径
  if (src.startsWith('./') || src.startsWith('../')) {
    return src.replace(/^\.\/|^\.\.\//, '/');
  }
  
  // 其他情况，假设是相对于根目录的路径
  return src.startsWith('/') ? src : `/${src}`;
}