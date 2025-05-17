/**
 * Vercel环境专用存储服务
 * 不使用sharp库，避免构建问题
 */

import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';
import { StorageService, FileInfo, UploadResult } from './storage-service';
import { LocalStorageConfig } from '../config/storage';

/**
 * Vercel环境存储服务实现
 * 与LocalStorageService功能相同，但不使用sharp库
 */
export class VercelStorageService implements StorageService {
  private config: LocalStorageConfig;

  constructor(config: LocalStorageConfig) {
    this.config = config;
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

      // 写入文件 - 不进行任何处理
      // 使用Uint8Array来避免类型错误
      const uint8Array = new Uint8Array(file.buffer);
      await fsPromises.writeFile(fullPath, uint8Array);

      // 构建URL
      const url = path.posix.join(this.config.baseUrl, relativePath.replace(/\\/g, '/'), filename);

      return {
        filename,
        originalFilename: file.originalFilename,
        path: storagePath,
        url,
        size: file.buffer.length,
        width: undefined, // 不处理图片，所以不提供宽高信息
        height: undefined,
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
} 