import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import { StorageService, FileInfo, UploadResult } from './storage-service';
import { LocalStorageConfig } from '../config/storage';

// 判断当前环境
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

// 在非Vercel环境中动态导入sharp
let sharpModule: any = null;

// 不在此处导入sharp，避免webpack静态分析

/**
 * 本地存储服务实现
 */
export class LocalStorageService implements StorageService {
  private config: LocalStorageConfig;
  private compressImages: boolean;
  private maxWidth?: number;
  private quality?: number;

  constructor(config: LocalStorageConfig, compressImages = true, maxWidth?: number, quality?: number) {
    this.config = config;
    this.compressImages = compressImages && !isVercel; // 在Vercel环境中禁用图片压缩
    this.maxWidth = maxWidth;
    this.quality = quality;
    
    // 在构造函数中动态导入sharp，避免webpack静态分析
    if (!isVercel && !sharpModule) {
      this.loadSharpModule().catch(err => {
        console.warn('无法加载sharp模块:', err.message);
      });
    }
  }
  
  /**
   * 动态加载sharp模块
   */
  private async loadSharpModule(): Promise<void> {
    if (isVercel || sharpModule) return;
    
    try {
      // 动态导入sharp模块
      const module = await import('sharp');
      sharpModule = module.default || module;
      console.log('成功加载sharp模块');
    } catch (error) {
      console.warn('无法导入sharp库:', (error as Error).message);
    }
  }

  /**
   * 上传文件
   * @param file 文件信息
   * @returns 上传结果
   */
  async uploadFile(file: FileInfo): Promise<UploadResult> {
    try {
      // 生成存储路径
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const relativePath = path.join('images', String(year), month);
      const uploadPath = path.join(this.config.uploadDir, relativePath);

      // 确保目录存在
      await this.ensureDir(uploadPath);

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileExtension = this.getFileExtension(file.originalFilename);
      const filename = `${timestamp}-${randomString}${fileExtension}`;
      const fullPath = path.join(uploadPath, filename);
      const storagePath = path.join(relativePath, filename);

      // 处理图片（如果需要压缩且不在Vercel环境中）
      let buffer = file.buffer;
      let width: number | undefined;
      let height: number | undefined;

      if (this.isImage(file.mimeType) && this.compressImages && !isVercel && sharpModule) {
        try {
          const processedImage = await this.processImage(file.buffer);
          buffer = processedImage.buffer;
          width = processedImage.width;
          height = processedImage.height;
        } catch (error) {
          console.warn('图片处理失败，使用原始图片:', (error as Error).message);
          // 使用原始图片
        }
      }

      // 写入文件 - 使用Uint8Array避免类型错误
      const uint8Array = new Uint8Array(buffer);
      await fsPromises.writeFile(fullPath, uint8Array);

      // 构建URL
      const url = path.posix.join(this.config.baseUrl, relativePath.replace(/\\/g, '/'), filename);

      return {
        filename,
        originalFilename: file.originalFilename,
        path: storagePath,
        url,
        size: buffer.length,
        width,
        height,
        mimeType: file.mimeType,
        storageType: 'local'
      };
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(`文件上传失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取文件URL
   * @param filePath 文件路径
   * @returns 文件URL
   */
  getFileUrl(filePath: string): string {
    return path.posix.join(this.config.baseUrl, filePath.replace(/\\/g, '/'));
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   * @returns 是否删除成功
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.uploadDir, filePath);
      
      // 检查文件是否存在
      if (await this.fileExists(filePath)) {
        await fsPromises.unlink(fullPath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('文件删除失败:', error);
      return false;
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   * @returns 文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.uploadDir, filePath);
      await fsPromises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 确保目录存在
   * @param dir 目录路径
   */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await fsPromises.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error('创建目录失败:', error);
      throw new Error(`创建目录失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取文件扩展名
   * @param filename 文件名
   * @returns 文件扩展名
   */
  private getFileExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return ext;
  }

  /**
   * 检查是否为图片
   * @param mimeType MIME类型
   * @returns 是否为图片
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * 处理图片（压缩、调整大小）
   * @param buffer 图片缓冲区
   * @returns 处理后的图片信息
   */
  private async processImage(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
    if (!sharpModule || isVercel) {
      // 在Vercel环境中或sharp不可用时，返回原始图片
      return {
        buffer,
        width: 0,
        height: 0
      };
    }
    
    try {
      // 使用any类型避免TypeScript错误
      const sharpInstance = sharpModule(buffer as any);
      
      // 获取图片元数据
      const metadata = await sharpInstance.metadata();
      
      // 如果设置了最大宽度且图片宽度大于最大宽度，则调整大小
      if (this.maxWidth && metadata.width && metadata.width > this.maxWidth) {
        sharpInstance.resize({
          width: this.maxWidth,
          withoutEnlargement: true
        });
      }
      
      // 根据图片格式设置压缩选项
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        sharpInstance.jpeg({ quality: this.quality || 85 });
      } else if (metadata.format === 'png') {
        sharpInstance.png({ quality: this.quality || 85 });
      } else if (metadata.format === 'webp') {
        sharpInstance.webp({ quality: this.quality || 85 });
      }
      
      // 处理图片
      const processedBuffer = await sharpInstance.toBuffer({ resolveWithObject: true });
      
      return {
        buffer: processedBuffer.data,
        width: processedBuffer.info.width,
        height: processedBuffer.info.height
      };
    } catch (error) {
      console.error('图片处理失败:', error);
      // 如果处理失败，返回原始图片
      return {
        buffer,
        width: 0,
        height: 0
      };
    }
  }
} 