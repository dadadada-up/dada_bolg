import { StorageService, StorageServiceFactory } from './storage-service';
import { LocalStorageService } from './local-storage';
import { getStorageConfig } from '../config/storage';

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