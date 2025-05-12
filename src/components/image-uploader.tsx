import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  postId?: number;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  imageId: number;
  url: string;
  error?: string;
}

export function ImageUploader({ onImageUploaded, postId, className = '' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 上传文件
    await uploadFile(file);
  };

  // 处理拖放
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 上传文件
    await uploadFile(file);
  };

  // 处理粘贴
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // 显示预览
          const reader = new FileReader();
          reader.onload = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          // 上传文件
          await uploadFile(file);
          break;
        }
      }
    }
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (postId) {
        formData.append('postId', postId.toString());
      }
      
      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData
      });
      
      const data: UploadResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '上传失败');
      }
      
      // 上传成功
      onImageUploaded(data.url);
      
      // 清除预览
      setTimeout(() => {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // 取消上传
  const handleCancel = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 注册粘贴事件监听器
  useState(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  });

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
        } ${preview ? 'bg-secondary/50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!preview ? (
          <>
            <div className="flex flex-col items-center justify-center py-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                拖放图片到此处，或点击上传
              </p>
              <p className="text-xs text-muted-foreground">
                支持 JPG, PNG, GIF, WEBP 格式，最大 5MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  选择图片
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="预览"
              className="max-h-40 mx-auto rounded-md"
            />
            {!isUploading && (
              <button
                type="button"
                className="absolute top-1 right-1 bg-secondary rounded-full p-1"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      {error && (
        <div className="text-destructive text-sm mt-2">{error}</div>
      )}
    </div>
  );
} 