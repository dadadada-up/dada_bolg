import { NextRequest } from 'next/server';
import * as imageRepository from '@/lib/db/repositories/image-repository';
import { getStorageService } from '@/lib/storage/storage-factory';

/**
 * 获取单个图片信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return Response.json(
        { error: '无效的图片ID' },
        { status: 400 }
      );
    }
    
    const image = await imageRepository.getImageById(id);
    
    if (!image) {
      return Response.json(
        { error: '图片不存在' },
        { status: 404 }
      );
    }
    
    return Response.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error(`获取图片失败: ${params.id}`, error);
    return Response.json(
      { error: `获取图片失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * 更新图片信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return Response.json(
        { error: '无效的图片ID' },
        { status: 400 }
      );
    }
    
    // 获取现有图片
    const existingImage = await imageRepository.getImageById(id);
    
    if (!existingImage) {
      return Response.json(
        { error: '图片不存在' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const data = await request.json();
    
    // 更新图片
    const success = await imageRepository.updateImage(id, {
      post_id: data.postId !== undefined ? data.postId : existingImage.post_id,
      url: data.url || existingImage.url
    });
    
    if (!success) {
      return Response.json(
        { error: '更新图片失败' },
        { status: 500 }
      );
    }
    
    // 获取更新后的图片
    const updatedImage = await imageRepository.getImageById(id);
    
    return Response.json({
      success: true,
      data: updatedImage
    });
  } catch (error) {
    console.error(`更新图片失败: ${params.id}`, error);
    return Response.json(
      { error: `更新图片失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * 删除图片
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return Response.json(
        { error: '无效的图片ID' },
        { status: 400 }
      );
    }
    
    // 获取图片信息
    const image = await imageRepository.getImageById(id);
    
    if (!image) {
      return Response.json(
        { error: '图片不存在' },
        { status: 404 }
      );
    }
    
    // 获取存储服务
    const storageService = getStorageService();
    
    // 删除物理文件
    await storageService.deleteFile(image.path);
    
    // 删除数据库记录
    const success = await imageRepository.deleteImage(id);
    
    if (!success) {
      return Response.json(
        { error: '删除图片失败' },
        { status: 500 }
      );
    }
    
    return Response.json({
      success: true,
      message: '图片已成功删除'
    });
  } catch (error) {
    console.error(`删除图片失败: ${params.id}`, error);
    return Response.json(
      { error: `删除图片失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 