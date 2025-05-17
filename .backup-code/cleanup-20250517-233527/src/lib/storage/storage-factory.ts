import { StorageService, StorageServiceFactory } from './storage-service';
import { LocalStorageService } from './local-storage';
import { VercelStorageService } from './vercel-storage';
import { getStorageConfig } from '../config/storage';

// 判断当前环境
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

/**
 * 默认存储服务工厂
 */
export class DefaultStorageServiceFactory implements StorageServiceFactory {
  /**
   * 创建存储服务
   * @returns 存储服务实例
   */
  createStorageService(): StorageService {
    const config = getStorageConfig();
    
    // 如果在Vercel环境中，使用不依赖sharp的存储服务
    if (isVercel) {
      console.log('在Vercel环境中使用VercelStorageService');
      return new VercelStorageService(config.local);
    }
    
    // 根据配置类型创建相应的存储服务
    switch (config.type) {
      case 'local':
        return new LocalStorageService(
          config.local,
          config.upload.compressImages,
          config.upload.maxWidth,
          config.upload.quality
        );
      // TODO: 实现其他存储服务（OSS、COS、S3等）
      default:
        // 默认使用本地存储
        return new LocalStorageService(
          config.local,
          config.upload.compressImages,
          config.upload.maxWidth,
          config.upload.quality
        );
    }
  }
}

// 存储服务单例
let storageServiceInstance: StorageService | null = null;

/**
 * 获取存储服务实例
 * @returns 存储服务实例
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const factory = new DefaultStorageServiceFactory();
    storageServiceInstance = factory.createStorageService();
  }
  return storageServiceInstance;
} 