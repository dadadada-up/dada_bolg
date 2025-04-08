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
    // 修复代码块前后缺少换行符的问题和序号转义问题
    const fixedMarkdown = markdown
      // 修复标题中数字序号的转义问题
      .replace(/^(#{1,6})\s+(\d+)\\\.(\s+.+)$/gm, '$1 $2.$3')
      // 修复列表项中数字序号的转义问题
      .replace(/^(\s*)(\d+)\\\.(\s+.+)$/gm, '$1$2.$3')
      // 确保代码块前后有足够的空行
      .replace(/```(\w+)\n/g, '\n```$1\n')
      .replace(/\n```\n/g, '\n\n```\n')
      // 修复表格前后缺少换行符的问题
      .replace(/\n\|\s/g, '\n\n| ')
      .replace(/\|\n([^|])/g, '|\n\n$1');

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm) // 启用GFM扩展（表格、任务列表等）
      .use(remarkRehype, { allowDangerousHtml: true }) // 允许传递HTML
      .use(rehypeRaw) // 解析HTML
      .use(rehypeSanitize) // 净化HTML
      .use(rehypeSlug) // 为标题添加id
      .use(rehypeAutolinkHeadings) // 为标题添加链接
      .use(rehypePrismPlus) // 使用Prism高亮代码
      .use(rehypeFormat) // 格式化HTML
      .use(rehypeStringify) // 转换为字符串
      .process(fixedMarkdown);

    return result.toString();
  } catch (error) {
    console.error('Markdown转换失败:', error);
    // 简单的错误处理，返回原始Markdown包装在pre标签中
    return `<pre class="markdown-error">${markdown}</pre>`;
  }
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

// 提取文章的阅读时间（以分钟为单位）
export function calculateReadingTime(markdown: string): number {
  // 移除Markdown语法和图片
  const text = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '$1');
  
  // 计算单词数（按空格分割）
  const wordCount = text.split(/\s+/).length;
  
  // 假设平均阅读速度为每分钟200个单词
  const readingTime = Math.ceil(wordCount / 200);
  
  return Math.max(1, readingTime); // 至少1分钟
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