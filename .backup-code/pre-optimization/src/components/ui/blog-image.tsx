'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  targetId?: string;
}

export function BlogImage({ src, alt, caption, className = '', targetId }: BlogImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [tryCount, setTryCount] = useState(0);

  useEffect(() => {
    // 打印图片信息用于调试
    console.log(`[BlogImage] 图片加载: ${src}, targetId: ${targetId || 'none'}`);
    
    // 处理图片URL
    const processImageUrl = (url: string): string => {
      // 打印原始URL帮助调试
      console.log(`[BlogImage] 处理图片URL: ${url}`);
      
      // 处理语雀图片
      if (url.includes('cdn.nlark.com') || url.includes('yuque.com')) {
        console.log(`[BlogImage] 检测到语雀图片: ${url}`);
        
        // 确保URL不是已经经过代理的
        if (url.includes('/api/proxy?url=')) {
          return url;
        }
        
        // 确保正确编码URL，并添加时间戳防止缓存问题
        const encodedUrl = encodeURIComponent(url);
        const proxyUrl = `/api/proxy?url=${encodedUrl}&t=${Date.now()}`;
        console.log(`[BlogImage] 代理URL: ${proxyUrl}`);
        
        return proxyUrl;
      }
      
      // 处理路径问题：docs/images/路径修复
      if (url.includes('docs/images/')) {
        console.log(`[BlogImage] 检测到docs/images路径: ${url}`);
        return `https://raw.githubusercontent.com/dadadada-up/dada_bolg/main/${url}`;
      }
      
      // 处理相对路径
      if (!url.startsWith('http') && !url.startsWith('https')) {
        if (url.startsWith('/')) {
          // 绝对路径（相对于仓库根目录）
          return `https://raw.githubusercontent.com/dadadada-up/dada_bolg/main${url}`;
        } else {
          // 相对路径（尝试使用从slug生成的路径）
          // 检查URL是否包含已知的项目目录
          const possiblePaths = [
            `/assets/images/${url}`,
            `/images/${url}`,
            `/public/images/${url}`,
            `https://raw.githubusercontent.com/dadadada-up/dada_bolg/main/docs/images/${url}`
          ];
          console.log(`[BlogImage] 尝试以下可能的路径:`);
          possiblePaths.forEach(path => console.log(` - ${path}`));
          return possiblePaths[0]; // 默认使用第一个路径
        }
      }
      
      // 其他图片直接返回
      return url;
    };
    
    // 处理图片地址
    setImageSrc(processImageUrl(src));
  }, [src, tryCount]);

  const handleLoad = () => {
    console.log(`[BlogImage] 图片加载成功: ${imageSrc}`);
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[BlogImage] 图片加载失败: ${imageSrc}`, e);
    setIsLoading(false);
    setHasError(true);
    
    // 分析图片URL来找出可能的问题
    const originalUrl = src;
    console.log(`[BlogImage] 原始URL: ${originalUrl}, 处理后URL: ${imageSrc}`);
    
    // 记录尝试的URL，防止重复尝试
    const triedUrls = new Set<string>();
    triedUrls.add(imageSrc);
    
    // 尝试使用备用加载方法，最多重试3次
    if (tryCount < 3) {
      let nextUrl = '';
      
      // 检查是否为语雀图片
      if (originalUrl.includes('cdn.nlark.com') || originalUrl.includes('yuque.com')) {
        console.log(`[BlogImage] 语雀图片加载失败，尝试备用方法`);
        
        // 使用不同的代理方式尝试加载语雀图片
        const encodedUrl = encodeURIComponent(originalUrl);
        
        // 如果当前已经是代理但加载失败，尝试不同的代理方式
        if (imageSrc.includes('/api/proxy?url=')) {
          // 使用不同的代理服务
          nextUrl = `https://images.weserv.nl/?url=${encodedUrl}&default=placeholder`;
        } else {
          // 使用自己的代理，但添加时间戳防止缓存问题
          nextUrl = `/api/proxy?url=${encodedUrl}&t=${Date.now()}&retry=${tryCount}`;
        }
      } 
      // 根据URL类型选择不同的重试策略
      else if (imageSrc.includes('docs/images/')) {
        // docs/images路径的图片，尝试不同的URL格式
        const filename = imageSrc.split('/').pop() || '';
        const alternativeUrls = [
          `https://raw.githubusercontent.com/dadadada-up/dada_bolg/main/docs/images/${filename}`,
          `/api/proxy?url=${encodeURIComponent(`https://raw.githubusercontent.com/dadadada-up/dada_bolg/main/docs/images/${filename}`)}`,
          `/assets/images/${filename}`
        ];
        
        // 选择一个未尝试过的URL
        for (const url of alternativeUrls) {
          if (!triedUrls.has(url)) {
            nextUrl = url;
            triedUrls.add(url);
            break;
          }
        }
      } else if (imageSrc.includes('/assets/images/')) {
        // 资源目录图片失败，尝试GitHub仓库
        const filename = imageSrc.split('/').pop() || '';
        nextUrl = `https://raw.githubusercontent.com/dadadada-up/dada_bolg/main/docs/images/${filename}`;
      } else if (imageSrc.startsWith('http') && !imageSrc.includes('/api/proxy')) {
        // HTTP图片使用代理
        nextUrl = `/api/proxy?url=${encodeURIComponent(imageSrc)}`;
      } else {
        // 默认行为：尝试使用图片代理服务
        const proxyUrls = [
          `/api/proxy?url=${encodeURIComponent(imageSrc)}&t=${Date.now()}`,
          `https://images.weserv.nl/?url=${encodeURIComponent(imageSrc)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(imageSrc)}`
        ];
        
        // 选择一个未尝试过的URL
        for (const url of proxyUrls) {
          if (!triedUrls.has(url)) {
            nextUrl = url;
            triedUrls.add(url);
            break;
          }
        }
      }
      
      if (nextUrl) {
        console.log(`[BlogImage] 尝试使用替代URL #${tryCount + 1}: ${nextUrl}`);
        setImageSrc(nextUrl);
        setTryCount(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
      } else {
        console.error(`[BlogImage] 无法找到可用的替代URL，放弃尝试`);
      }
    } else {
      console.error(`[BlogImage] 已达到最大重试次数(${tryCount})，放弃加载: ${imageSrc}`);
    }
  };

  // 默认样式类
  const imageClasses = `blog-image ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500 rounded-lg ${className}`;
  
  // 如果有targetId，直接渲染到目标元素
  useEffect(() => {
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        console.log(`[BlogImage] 正在渲染到目标元素: #${targetId}`);
        
        // 清空目标元素
        targetElement.innerHTML = '';
        
        // 创建图片容器
        const container = document.createElement('div');
        container.className = 'blog-image-container my-6';
        
        // 添加图片
        const imgElement = document.createElement('img');
        imgElement.src = imageSrc;
        imgElement.alt = alt;
        imgElement.className = imageClasses;
        // 允许跨域获取
        imgElement.crossOrigin = "anonymous";
        imgElement.onload = handleLoad;
        imgElement.onerror = () => {
          console.error(`[BlogImage] DOM渲染的图片加载失败: ${imageSrc}`);
          
          // 尝试备用方法加载图片
          if (tryCount < 3) {
            console.log(`[BlogImage] DOM元素将重试加载图片: ${imageSrc}`);
            setTryCount(prev => prev + 1);
            return;
          }
          
          imgElement.classList.add('error');
          imgElement.style.display = 'none';
          
          // 创建错误提示
          const errorDiv = document.createElement('div');
          errorDiv.className = 'flex flex-col justify-center items-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-700';
          errorDiv.innerHTML = `
            <svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p class="text-sm text-gray-600 dark:text-gray-400">图片加载失败: ${alt || '未知图片'}</p>
            <p class="text-xs text-gray-500 mt-2">${imageSrc}</p>
            <div class="flex gap-2 mt-3">
              <a href="${imageSrc}" target="_blank" class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                在新窗口打开
              </a>
              <button class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 retry-btn">
                重试加载
              </button>
            </div>
          `;
          
          // 添加重试按钮事件
          setTimeout(() => {
            const retryBtn = errorDiv.querySelector('.retry-btn');
            if (retryBtn) {
              retryBtn.addEventListener('click', () => {
                // 强制刷新图片
                setTryCount(prev => prev + 1);
                console.log(`[BlogImage] 用户点击重试加载图片: ${imageSrc}`);
              });
            }
          }, 100);
          
          container.appendChild(errorDiv);
        };
        imgElement.style.margin = '0 auto';
        imgElement.style.maxWidth = '100%';
        imgElement.style.height = 'auto';
        
        // 添加到容器
        container.appendChild(imgElement);
        
        // 添加说明文字
        if (caption) {
          const figCaption = document.createElement('figcaption');
          figCaption.className = 'text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic';
          figCaption.textContent = caption;
          container.appendChild(figCaption);
        }
        
        // 添加到目标元素
        targetElement.appendChild(container);
      } else {
        console.error(`[BlogImage] 找不到目标元素: #${targetId}`);
      }
    }
  }, [targetId, imageSrc, alt, caption, imageClasses, tryCount]);
  
  // 如果有targetId，不直接渲染内容
  if (targetId) {
    return null;
  }
  
  return (
    <div className="blog-image-container my-6">
      {isLoading && (
        <div className="flex justify-center items-center py-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
          <svg className="w-10 h-10 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col justify-center items-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-700">
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">图片加载失败: {alt || '未知图片'}</p>
          <p className="text-xs text-gray-500 mt-2">{imageSrc}</p>
          <div className="flex gap-2 mt-3">
            <a 
              href={imageSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              在新窗口打开
            </a>
            <button 
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                setTryCount(prev => prev + 1);
              }}
            >
              重试加载
            </button>
          </div>
        </div>
      ) : (
        <>
          {(imageSrc.startsWith('http') || imageSrc.startsWith('https')) ? (
            // 外部图片使用img标签
            <img
              src={imageSrc}
              alt={alt}
              className={imageClasses}
              crossOrigin="anonymous"
              onLoad={handleLoad}
              onError={handleError}
              style={{
                display: isLoading ? 'none' : 'block',
                margin: '0 auto',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          ) : (
            // 本地图片使用Next.js Image组件
            <Image
              src={imageSrc}
              alt={alt}
              width={800}
              height={600}
              className={imageClasses}
              onLoad={handleLoad}
              onError={handleError}
              style={{
                display: isLoading ? 'none' : 'block',
                margin: '0 auto',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          )}
          
          {caption && (
            <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
              {caption}
            </figcaption>
          )}
        </>
      )}
    </div>
  );
}

export default BlogImage; 