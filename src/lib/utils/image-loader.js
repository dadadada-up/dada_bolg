// 自定义图片加载器，用于静态导出模式
export default function customLoader({ src, width, quality }) {
  // 如果src是相对路径，直接返回
  if (src.startsWith('/')) {
    return src;
  }
  
  // 如果src是绝对URL，直接返回
  if (src.startsWith('http')) {
    return src;
  }
  
  // 其他情况返回相对路径
  return `/${src}`;
} 