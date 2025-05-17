import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { ImageUploader } from '../image-uploader';
import { ImageManager } from '../image-manager';

interface ImageUploadButtonProps {
  onImageInserted: (imageUrl: string) => void;
  postId?: number;
  className?: string;
}

export function ImageUploadButton({ onImageInserted, postId, className = '' }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 处理对话框显示状态
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    if (showDialog) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [showDialog]);

  // 处理文件选择
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    
    // 上传文件
    await uploadFile(file);
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
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '上传失败');
      }
      
      // 上传成功，插入图片
      onImageInserted(data.url);
      
      // 清除输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理图片选择
  const handleImageSelected = (imageUrl: string) => {
    onImageInserted(imageUrl);
    setShowDialog(false);
  };

  // 处理按钮点击
  const handleButtonClick = () => {
    setShowDialog(true);
  };

  // 处理对话框关闭
  const handleDialogClose = () => {
    setShowDialog(false);
  };

  return (
    <>
      <div className={`inline-flex ${className}`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          title="插入图片"
          disabled={isUploading}
          className="px-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <dialog 
        ref={dialogRef} 
        className="fixed z-50 rounded-lg shadow-lg p-0 max-w-4xl w-[90vw] backdrop:bg-black/50"
        onClose={() => setShowDialog(false)}
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">图片管理</h2>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDialogClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">上传新图片</h3>
              <ImageUploader 
                onImageUploaded={handleImageSelected} 
                postId={postId}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">已上传的图片</h3>
              <ImageManager 
                onSelectImage={handleImageSelected}
                postId={postId}
              />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}