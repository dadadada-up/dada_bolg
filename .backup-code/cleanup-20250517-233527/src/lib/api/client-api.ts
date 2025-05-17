import { Post } from '@/types/post';
import { 
  getAllCategoryMappings as getCategoryMappingsFromService,
  processCategories as processCategoriesFromService
} from '@/lib/content/category-service';

// 分类操作相关函数
export async function getDisplayCategoryName(englishName: string): Promise<string> {
  const res = await fetch(`/api/categories-new/translate?name=${encodeURIComponent(englishName)}&direction=toChinese`);
  if (res.ok) {
    const data = await res.json();
    return data.translatedName || englishName;
  }
  return englishName;
}

export async function getEnglishCategoryName(chineseName: string): Promise<string> {
  const res = await fetch(`/api/categories-new/translate?name=${encodeURIComponent(chineseName)}&direction=toEnglish`);
  if (res.ok) {
    const data = await res.json();
    return data.translatedName || chineseName;
  }
  return chineseName;
}

// 文章操作函数
export async function processCategories(categories: string[]): Promise<string[]> {
  try {
    // 如果没有传入分类或分类为空，返回默认分类
    if (!categories || categories.length === 0) {
      return ['tech-tools'];
    }
    
    // 获取标准分类列表
    const standardResponse = await fetch('/api/categories-new');
    if (standardResponse.ok) {
      const standardCategories = await standardResponse.json();
      
      // 标准分类的slug映射
      const standardSlugs = standardCategories.map((cat: any) => cat.slug);
      
      // 映射处理：对每个分类，如果它已经是标准slug，则直接使用；
      // 否则尝试从API进行转换
      const processedCategories = await Promise.all(
        categories.map(async (category) => {
          // 检查是否已经是标准slug，如果是直接返回
          if (standardSlugs.includes(category)) {
            return category;
          }
          
          // 尝试通过API转换
          try {
            const res = await fetch(`/api/categories-new/translate?name=${encodeURIComponent(category)}&direction=toEnglish`);
            if (res.ok) {
              const data = await res.json();
              // 如果转换后的slug是标准分类之一，使用它
              if (data.translatedName && standardSlugs.includes(data.translatedName)) {
                console.log(`[processCategories] 转换分类: ${category} -> ${data.translatedName}`);
                return data.translatedName;
              }
            }
          } catch (err) {
            console.error(`转换分类失败: ${category}`, err);
          }
          
          // 如果没有找到对应的标准分类，使用原始分类名
          return category;
        })
      );
      
      return processedCategories;
    }
    
    // 转换失败时，使用原始分类
    return categories;
  } catch (error) {
    console.error('处理分类名称失败:', error);
    return categories;
  }
}

// 更新文章API (替代原来依赖github.ts的版本)
export async function updatePost(slug: string, postData: Post) {
  // 如果没有提供ID，先获取文章详情
  if (!postData.id) {
    try {
      const postResponse = await fetch(`/api/posts-new/${slug}?nocache=true&t=${Date.now()}`);
      if (postResponse.ok) {
        const existingPost = await postResponse.json();
        // 确保使用现有文章的ID
        if (existingPost && existingPost.id) {
          postData.id = existingPost.id;
          console.log(`[updatePost] 获取到现有文章ID: ${postData.id}`);
        } else {
          console.warn('[updatePost] 无法获取现有文章ID');
        }
      }
    } catch (error) {
      console.error('获取文章ID失败:', error);
      // 继续执行，让后端处理
    }
  }

  // 确保有displayCategories字段，如果没有则获取
  let displayCategories = postData.displayCategories || [];
  
  if (!displayCategories.length && postData.categories.length) {
    try {
      // 从API获取中文分类名
      const categoriesResponse = await fetch('/api/categories-new');
      if (categoriesResponse.ok) {
        const allCategories = await categoriesResponse.json();
        const categoryMap = allCategories.reduce((map: Record<string, string>, cat: any) => {
          // 重要：使用slug作为键，name作为值
          map[cat.slug] = cat.name;
          return map;
        }, {});
        
        // 使用分类的slug查找对应的中文名称
        displayCategories = postData.categories.map(cat => {
          // 检查并提取可能存在的ID后缀
          const basicSlug = cat.split('-').slice(0, -1).join('-');
          const originalSlug = categoryMap[cat] ? cat : basicSlug;
          return categoryMap[originalSlug] || categoryMap[cat] || cat;
        });
        
        console.log('[updatePost] 获取到分类显示名称:', displayCategories);
      }
    } catch (error) {
      console.error('获取分类显示名称失败:', error);
      // 如果获取失败，使用原始分类
      displayCategories = postData.categories;
    }
  }
  
  // 先处理分类名转换 - 确保使用英文slug
  const processedCategories = await processCategories(postData.categories);
  
  // 确保categories和displayCategories都被正确设置
  const processedPostData = {
    ...postData,
    id: postData.id, // 确保ID被正确传递
    categories: processedCategories,
    displayCategories: displayCategories.length ? displayCategories : processedCategories
  };
  
  console.log('[updatePost] 处理后的文章数据:', {
    id: processedPostData.id,
    categories: processedPostData.categories,
    displayCategories: processedPostData.displayCategories
  });
  
  const response = await fetch(`/api/posts-new/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(processedPostData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '更新文章失败');
  }
  
  return data;
}

// 创建文章API
export async function createPost(postData: Post) {
  // 确保有displayCategories字段，如果没有则获取
  let displayCategories = postData.displayCategories || [];
  
  if (!displayCategories.length && postData.categories.length) {
    try {
      // 从API获取中文分类名
      const categoriesResponse = await fetch('/api/categories-new');
      if (categoriesResponse.ok) {
        const allCategories = await categoriesResponse.json();
        const categoryMap = allCategories.reduce((map: Record<string, string>, cat: any) => {
          // 重要：使用slug作为键，name作为值
          map[cat.slug] = cat.name;
          return map;
        }, {});
        
        // 使用分类的slug查找对应的中文名称
        displayCategories = postData.categories.map(cat => {
          // 检查并提取可能存在的ID后缀
          const basicSlug = cat.split('-').slice(0, -1).join('-');
          const originalSlug = categoryMap[cat] ? cat : basicSlug;
          return categoryMap[originalSlug] || categoryMap[cat] || cat;
        });
        
        console.log('[createPost] 获取到分类显示名称:', displayCategories);
      }
    } catch (error) {
      console.error('获取分类显示名称失败:', error);
      // 如果获取失败，使用原始分类
      displayCategories = postData.categories;
    }
  }
  
  // 先处理分类名转换 - 确保使用英文slug
  const processedCategories = await processCategoriesFromService(postData.categories);
  
  // 确保categories和displayCategories都被正确设置
  const processedPostData = {
    ...postData,
    categories: processedCategories,
    displayCategories: displayCategories.length ? displayCategories : processedCategories
  };
  
  console.log('[createPost] 处理后的文章数据:', {
    categories: processedPostData.categories,
    displayCategories: processedPostData.displayCategories
  });
  
  const response = await fetch('/api/posts-new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(processedPostData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '创建文章失败');
  }
  
  return data;
}

// 删除文章API
export async function deletePost(slug: string) {
  try {
    // 添加请求超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    // 请求前先检查该文章是否存在
    const checkResponse = await fetch(`/api/posts-new/${slug}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 如果文章不存在，直接返回错误
    if (checkResponse.status === 404) {
      return {
        success: false,
        error: '文章不存在或已被删除',
        notFound: true
      };
    }
    
    // 发起删除请求
    const deleteController = new AbortController();
    const deleteTimeoutId = setTimeout(() => deleteController.abort(), 30000);
    
    const response = await fetch(`/api/posts-new/${slug}`, {
      method: 'DELETE',
      signal: deleteController.signal,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(deleteTimeoutId);
    
    // 解析响应
    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error('解析删除响应失败:', err);
      data = { error: '解析响应失败' };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `删除文章失败: ${response.status}`,
        status: response.status
      };
    }
    
    // 删除成功后主动清除缓存
    try {
      await fetch('/api/cache/clear', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (cacheError) {
      console.warn('清除缓存失败，但文章已删除:', cacheError);
    }
    
    return {
      success: true,
      message: data.message || '文章删除成功'
    };
  } catch (error) {
    console.error('删除文章请求失败:', error);
    
    // 检查是否为超时错误
    if ((error as any).name === 'AbortError') {
      return {
        success: false,
        error: '删除请求超时，请稍后重试',
        timeout: true
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除文章失败，未知错误'
    };
  }
}

// 获取所有分类映射
export async function getAllCategoryMappings(): Promise<Array<{name: string, slug: string}>> {
  // 使用新的分类服务获取分类映射
  return await getCategoryMappingsFromService();
} 