'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ImageManager } from '@/components/image-manager';
import { Button } from '@/components/ui/button';
import { Clipboard, Check } from 'lucide-react';

export default function ImagesPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (selectedImage) {
      // 复制Markdown格式的图片链接
      const markdownImage = `![图片](${selectedImage})`;
      navigator.clipboard.writeText(markdownImage);
      setCopied(true);
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">图片管理</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ImageManager 
              onSelectImage={handleSelectImage}
              className="bg-card p-4 rounded-lg shadow-sm"
            />
          </div>
          
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">预览</h2>
              
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="border rounded-md p-2 bg-secondary/30">
                    <img 
                      src={selectedImage} 
                      alt="预览" 
                      className="max-w-full rounded-md mx-auto"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm bg-secondary p-2 rounded-md overflow-x-auto">
                      {`![图片](${selectedImage})`}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      title="复制Markdown代码"
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  请从左侧选择一张图片
                </div>
              )}
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">使用说明</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>点击左侧"选择图片"按钮或拖放图片到上传区域</li>
                <li>上传完成后，点击图片缩略图可以选择图片</li>
                <li>点击"复制"按钮可以复制Markdown格式的图片代码</li>
                <li>在文章编辑器中粘贴代码即可插入图片</li>
                <li>悬停在图片上可以看到删除按钮</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 