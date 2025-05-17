/**
 * 图片存储配置
 */

// 存储类型
export type StorageType = 'local' | 'oss' | 'cos' | 's3';

// 本地存储配置
export interface LocalStorageConfig {
  uploadDir: string;  // 上传目录
  baseUrl: string;    // 基础URL
}

// 云存储配置
export interface CloudStorageConfig {
  provider: 'oss' | 'cos' | 's3';  // 提供商
  region: string;                  // 区域
  bucket: string;                  // 存储桶
  accessKey: string;               // 访问密钥
  secretKey: string;               // 秘密密钥
  cdnDomain?: string;              // CDN域名
  pathPrefix?: string;             // 路径前缀
}

// 上传配置
export interface UploadConfig {
  maxSize: number;                 // 最大文件大小(字节)
  allowedTypes: string[];          // 允许的MIME类型
  compressImages: boolean;         // 是否压缩图片
  maxWidth?: number;               // 最大宽度
  quality?: number;                // 压缩质量(1-100)
}

// 存储配置
export interface StorageConfig {
  type: StorageType;               // 存储类型
  local: LocalStorageConfig;       // 本地存储配置
  cloud?: CloudStorageConfig;      // 云存储配置
  upload: UploadConfig;            // 上传配置
}

// 默认存储配置
export const defaultStorageConfig: StorageConfig = {
  type: 'local',
  local: {
    uploadDir: 'public/uploads',
    baseUrl: '/uploads'
  },
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    compressImages: true,
    maxWidth: 1920,
    quality: 85
  }
};

// 获取当前存储配置
export function getStorageConfig(): StorageConfig {
  // 从环境变量加载配置
  const config: StorageConfig = {
    ...defaultStorageConfig,
    type: (process.env.STORAGE_TYPE as StorageType) || defaultStorageConfig.type,
    local: {
      uploadDir: process.env.STORAGE_LOCAL_UPLOAD_DIR || defaultStorageConfig.local.uploadDir,
      baseUrl: process.env.STORAGE_LOCAL_BASE_URL || defaultStorageConfig.local.baseUrl
    },
    upload: {
      ...defaultStorageConfig.upload,
      maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || String(defaultStorageConfig.upload.maxSize)),
      compressImages: process.env.UPLOAD_COMPRESS_IMAGES === 'true' || defaultStorageConfig.upload.compressImages
    }
  };

  // 如果是云存储，加载云存储配置
  if (config.type !== 'local') {
    config.cloud = {
      provider: (process.env.CLOUD_STORAGE_PROVIDER as 'oss' | 'cos' | 's3') || 'oss',
      region: process.env.CLOUD_STORAGE_REGION || '',
      bucket: process.env.CLOUD_STORAGE_BUCKET || '',
      accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY || '',
      secretKey: process.env.CLOUD_STORAGE_SECRET_KEY || '',
      cdnDomain: process.env.CLOUD_STORAGE_CDN_DOMAIN,
      pathPrefix: process.env.CLOUD_STORAGE_PATH_PREFIX || 'blog/images'
    };
  }

  return config;
} 