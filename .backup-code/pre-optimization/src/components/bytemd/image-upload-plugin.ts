import type { BytemdPlugin } from 'bytemd';
import type { Editor } from 'codemirror';

interface ImageUploadOptions {
  /**
   * 上传图片的 API 地址
   */
  uploadUrl?: string;
  
  /**
   * 自定义上传函数，如果提供，将使用此函数而不是默认的上传逻辑
   */
  uploader?: (file: File) => Promise<string>;
  
  /**
   * 是否允许多选文件
   */
  multiple?: boolean;
}

/**
 * 创建 ByteMD 图片上传插件
 */
export function imageUploadPlugin(options: ImageUploadOptions = {}): BytemdPlugin {
  const { uploadUrl = '/api/images', uploader, multiple = false } = options;
  
  return {
    name: 'image-upload',
    remark: () => {
      return (tree) => tree;
    },
    viewerEffect() {
      // 查看器模式不需要额外处理
    },
    actions: [
      {
        title: '上传图片',
        icon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        handler: {
          type: 'action',
          click: (ctx) => {
            // 创建文件选择器
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = multiple;
            
            // 处理文件选择
            input.onchange = async () => {
              if (!input.files || input.files.length === 0) return;
              
              // 安全地获取 codemirror 编辑器实例
              const cm = ctx.codemirror as unknown as Editor;
              const cursor = cm.getCursor();
              
              // 处理每个选择的文件
              for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                try {
                  // 显示上传中的占位符
                  const placeholderText = `![${file.name}](上传中...)`;
                  cm.replaceRange(placeholderText, cursor);
                  
                  // 上传图片
                  let imageUrl;
                  if (uploader) {
                    imageUrl = await uploader(file);
                  } else {
                    imageUrl = await defaultUploader(file, uploadUrl);
                  }
                  
                  // 替换占位符为实际图片链接
                  const doc = cm.getDoc();
                  const placeholderPos = {
                    line: cursor.line,
                    ch: cursor.ch
                  };
                  const endPos = {
                    line: cursor.line,
                    ch: cursor.ch + placeholderText.length
                  };
                  doc.replaceRange(`![${file.name}](${imageUrl})`, placeholderPos, endPos);
                  
                  // 更新光标位置
                  if (i < input.files.length - 1) {
                    cursor.ch += `![${file.name}](${imageUrl})`.length;
                    cm.setCursor(cursor);
                  }
                } catch (error) {
                  console.error('图片上传失败:', error);
                  cm.replaceRange(`![上传失败](${file.name})`, cursor);
                }
              }
            };
            
            // 触发文件选择对话框
            input.click();
          }
        }
      }
    ]
  };
}

/**
 * 默认的图片上传处理函数
 */
async function defaultUploader(file: File, url: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`上传失败: ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '上传失败');
  }
  
  return data.url;
} 