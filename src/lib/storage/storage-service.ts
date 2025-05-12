/**
 * 存储服务接口
 */

// 上传文件结果
export interface UploadResult {
  filename: string;       // 存储的文件名
  originalFilename: string; // 原始文件名
  path: string;           // 存储路径
  url: string;            // 访问URL
  size: number;           // 文件大小(字节)
  width?: number;         // 图片宽度(像素)
  height?: number;        // 图片高度(像素)
  mimeType: string;       // MIME类型
  storageType: string;    // 存储类型
}

// 文件信息
export interface FileInfo {
  buffer: Buffer;         // 文件内容
  originalFilename: string; // 原始文件名
  mimeType: string;       // MIME类型
  size: number;           // 文件大小(字节)
}

// 存储服务接口
export interface StorageService {
  // 上传文件
  uploadFile(file: FileInfo): Promise<UploadResult>;
  
  // 获取文件URL
  getFileUrl(path: string): string;
  
  // 删除文件
  deleteFile(path: string): Promise<boolean>;
  
  // 检查文件是否存在
  fileExists(path: string): Promise<boolean>;
}

// 存储服务工厂
export interface StorageServiceFactory {
  // 创建存储服务
  createStorageService(): StorageService;
} 