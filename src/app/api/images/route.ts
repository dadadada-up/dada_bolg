import { NextRequest } from 'next/server';
import { getStorageService } from '@/lib/storage/storage-factory';
import * as imageRepository from '@/lib/db/repositories/image-repository';
import { getStorageConfig } from '@/lib/config/storage';

/**
 * 获取图片列表
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    let images;
    let total = 0;

    // 根据是否有postId参数决定获取特定文章的图片还是所有图片
    if (postId) {
      const postIdNum = parseInt(postId, 10);
      if (isNaN(postIdNum)) {
        return Response.json(
          { error: '无效的文章ID' },
          { status: 400 }
        );
      }
      images = await imageRepository.getImagesByPostId(postIdNum);
      total = images.length;
    } else {
      // 获取所有图片
      const result = await imageRepository.getAllImages({
        limit,
        offset,
        sortBy,
        sortOrder
      });
      images = result.images;
      total = result.total;
    }

    return Response.json({
      success: true,
      data: images,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return Response.json(
      { error: `获取图片列表失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * 上传图片
 */
export async function POST(request: NextRequest) {
  try {
    // 检查请求是否包含multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return Response.json(
        { error: '请求必须包含multipart/form-data' },
        { status: 400 }
      );
    }

    // 解析FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const postIdStr = formData.get('postId') as string | null;
    
    // 检查文件是否存在
    if (!file) {
      return Response.json(
        { error: '没有找到上传的文件' },
        { status: 400 }
      );
    }

    // 获取存储配置
    const config = getStorageConfig();
    
    // 验证文件类型
    if (!config.upload.allowedTypes.includes(file.type)) {
      return Response.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > config.upload.maxSize) {
      return Response.json(
        { error: `文件大小超过限制 (${Math.round(config.upload.maxSize / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());

    // 获取存储服务
    const storageService = getStorageService();

    // 上传文件
    const uploadResult = await storageService.uploadFile({
      buffer,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size
    });

    // 解析postId
    let postId: number | undefined = undefined;
    if (postIdStr) {
      const parsedId = parseInt(postIdStr, 10);
      if (!isNaN(parsedId)) {
        postId = parsedId;
      }
    }

    // 保存到数据库
    const imageId = await imageRepository.saveImage({
      filename: uploadResult.filename,
      original_filename: uploadResult.originalFilename,
      path: uploadResult.path,
      url: uploadResult.url,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height,
      mime_type: uploadResult.mimeType,
      storage_type: uploadResult.storageType,
      post_id: postId
    });

    // 返回上传结果
    return Response.json({
      success: true,
      imageId,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    return Response.json(
      { error: `图片上传失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}