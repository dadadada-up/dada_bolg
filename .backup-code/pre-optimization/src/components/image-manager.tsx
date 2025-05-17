import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { ImageUploader } from './image-uploader';

interface Image {
  id: number;
  url: string;
  filename: string;
  original_filename: string;
  size: number;
  width?: number;
  height?: number;
  created_at: string;
}

interface ImageManagerProps {
  postId?: number;
  onSelectImage: (imageUrl: string) => void;
  className?: string;
}

export function ImageManager({ postId, onSelectImage, className = '' }: ImageManagerProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 加载图片
  const loadImages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = postId 
        ? `/api/images?postId=${postId}&limit=100` 
        : '/api/images?limit=100';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('加载图片失败');
      }
      
      const data = await response.json();
      setImages(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除图片
  const deleteImage = async (id: number) => {
    setDeletingId(id);
    
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除图片失败');
      }
      
      // 从列表中移除
      setImages(images.filter(img => img.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 初始加载
  useEffect(() => {
    loadImages();
  }, [postId]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">图片管理</h3>
        <Button variant="outline" size="sm" onClick={loadImages} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <ImageUploader 
        onImageUploaded={(url) => {
          // 添加新上传的图片到列表
          loadImages();
          // 选中新上传的图片
          onSelectImage(url);
        }}
        postId={postId}
      />
      
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            暂无图片
          </div>
        ) : (
          images.map((image) => (
            <div 
              key={image.id} 
              className="relative group border rounded-md overflow-hidden bg-secondary/30"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.url}
                  alt={image.original_filename}
                  className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSelectImage(image.url)}
                />
              </div>
              <div className="p-2 text-xs">
                <div className="truncate" title={image.original_filename}>
                  {image.original_filename}
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{formatFileSize(image.size)}</span>
                  <span>{formatDate(image.created_at)}</span>
                </div>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => deleteImage(image.id)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 