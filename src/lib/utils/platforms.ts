import { Post } from '@/types/post';

// 转换markdown为纯文本
function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // 替换链接为链接文本
    .replace(/#{1,6}\s+([^\n]+)/g, '$1') // 移除标题标记
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
    .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
    .replace(/\n{3,}/g, '\n\n') // 将多个换行替换为两个换行
    .trim();
}

// 转换Markdown为HTML
function markdownToHtml(markdown: string): string {
  // 简单的Markdown到HTML转换
  // 实际项目中，使用完整的Markdown解析器，如marked或remark
  return markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>') // h3 标签
    .replace(/^## (.*$)/gm, '<h2>$1</h2>') // h2 标签
    .replace(/^# (.*$)/gm, '<h1>$1</h1>') // h1 标签
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />') // 图片
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // 链接
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>') // 引用
    .replace(/- (.*)\n/g, '<li>$1</li>') // 列表项
    .replace(/<\/li>\n<li>/g, '</li><li>') // 连接列表项
    .replace(/<\/li>(\n*)<\/blockquote>/g, '</li></ul></blockquote>') // 修复引用中的列表
    .replace(/<li>([^<]*)<\/li>/g, function(match, p1) {
      return '<ul><li>' + p1 + '</li></ul>';
    }) // 包裹列表项
    .replace(/\n/g, '<br />') // 换行
    .replace(/<\/h(\d)><br \/>/g, '</h$1>') // 修复标题后的换行
    .replace(/<\/blockquote><br \/>/g, '</blockquote>') // 修复引用后的换行
    .replace(/<ul><br \/>/g, '<ul>').replace(/<\/ul><br \/>/g, '</ul>'); // 修复列表前后的换行
}

// 平台接口
export interface Platform {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  enabled: boolean;
  requiresAuth: boolean;
  isAuthenticated?: boolean;
  publish: (post: Post) => Promise<{ success: boolean; url?: string; message?: string }>;
}

// 知乎平台
export const zhihuPlatform: Platform = {
  id: 'zhihu',
  name: '知乎',
  url: 'https://www.zhihu.com',
  icon: '/icons/zhihu.svg',
  description: '中文问答社区，分享专业知识',
  enabled: true,
  requiresAuth: true,
  isAuthenticated: false,
  async publish(post: Post) {
    try {
      // 这里应该调用知乎的API
      // 由于知乎没有公开API，实际使用中可能需要通过浏览器扩展或模拟登录来实现
      console.log(`[知乎] 尝试发布文章: ${post.title}`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        url: `https://zhuanlan.zhihu.com/p/demo-${Date.now()}`,
        message: '文章已成功发布到知乎'
      };
    } catch (error) {
      console.error(`[知乎] 发布失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发布到知乎失败'
      };
    }
  }
};

// 掘金平台
export const juejinPlatform: Platform = {
  id: 'juejin',
  name: '掘金',
  url: 'https://juejin.cn',
  icon: '/icons/juejin.svg',
  description: '开发者社区，分享技术文章',
  enabled: true,
  requiresAuth: true,
  isAuthenticated: false,
  async publish(post: Post) {
    try {
      // 这里应该调用掘金的API
      console.log(`[掘金] 尝试发布文章: ${post.title}`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        url: `https://juejin.cn/post/demo-${Date.now()}`,
        message: '文章已成功发布到掘金'
      };
    } catch (error) {
      console.error(`[掘金] 发布失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发布到掘金失败'
      };
    }
  }
};

// 微信公众号平台
export const wechatPlatform: Platform = {
  id: 'wechat',
  name: '微信公众号',
  url: 'https://mp.weixin.qq.com',
  icon: '/icons/wechat.svg',
  description: '微信公众平台，发布图文消息',
  enabled: true,
  requiresAuth: true,
  isAuthenticated: false,
  async publish(post: Post) {
    try {
      // 这里应该调用微信公众号的API
      console.log(`[微信公众号] 尝试发布文章: ${post.title}`);
      
      // 将Markdown转换为HTML
      const htmlContent = markdownToHtml(post.content);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: '文章已成功发布到微信公众号草稿箱，请登录公众号后台完成发布'
      };
    } catch (error) {
      console.error(`[微信公众号] 发布失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发布到微信公众号失败'
      };
    }
  }
};

// 语雀平台
export const yuquePlatform: Platform = {
  id: 'yuque',
  name: '语雀',
  url: 'https://www.yuque.com',
  icon: '/icons/yuque.svg',
  description: '专业的知识管理平台',
  enabled: true,
  requiresAuth: true,
  isAuthenticated: false,
  async publish(post: Post) {
    try {
      // 这里应该调用语雀的API
      console.log(`[语雀] 尝试发布文章: ${post.title}`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        url: `https://www.yuque.com/demo/post-${Date.now()}`,
        message: '文章已成功发布到语雀'
      };
    } catch (error) {
      console.error(`[语雀] 发布失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '发布到语雀失败'
      };
    }
  }
};

// 所有支持的平台
export const platforms: Platform[] = [
  zhihuPlatform,
  juejinPlatform,
  wechatPlatform,
  yuquePlatform
];

// 将文章发布到多个平台
export async function publishToMultiplePlatforms(
  post: Post, 
  platformIds: string[]
): Promise<Record<string, { success: boolean; url?: string; message?: string }>> {
  const results: Record<string, { success: boolean; url?: string; message?: string }> = {};
  
  // 过滤出要发布的平台
  const selectedPlatforms = platforms.filter(platform => 
    platformIds.includes(platform.id) && platform.enabled
  );
  
  // 并行发布到所有平台
  await Promise.all(
    selectedPlatforms.map(async platform => {
      try {
        results[platform.id] = await platform.publish(post);
      } catch (error) {
        console.error(`发布到 ${platform.name} 失败:`, error);
        results[platform.id] = { 
          success: false, 
          message: error instanceof Error ? error.message : `发布到 ${platform.name} 失败`
        };
      }
    })
  );
  
  return results;
} 