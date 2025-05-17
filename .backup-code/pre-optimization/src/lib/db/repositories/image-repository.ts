import * as db from '../database';
import { ImageModel } from '../models';

/**
 * 保存图片信息到数据库
 * @param image 图片信息
 * @returns 图片ID
 */
export async function saveImage(image: ImageModel): Promise<number> {
  try {
    // 准备SQL语句
    const sql = `
      INSERT INTO images (
        filename, original_filename, path, url, 
        size, width, height, mime_type, storage_type, post_id, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 准备参数
    const now = db.getCurrentTimestamp();
    const params = [
      image.filename,
      image.original_filename,
      image.path,
      image.url,
      image.size,
      image.width || null,
      image.height || null,
      image.mime_type,
      image.storage_type,
      image.post_id || null,
      image.created_at || now,
      image.updated_at || now
    ];
    
    // 执行插入
    const result = await db.execute(sql, params);
    
    // 获取最后插入的ID
    const lastIdResult = await db.queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
    const imageId = lastIdResult?.id || 0;
    
    console.log(`[图片存储库] 保存图片成功: ${imageId}`);
    return imageId;
  } catch (error) {
    console.error('[图片存储库] 保存图片失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取图片
 * @param id 图片ID
 * @returns 图片信息
 */
export async function getImageById(id: number): Promise<ImageModel | null> {
  try {
    const sql = `SELECT * FROM images WHERE id = ?`;
    const image = await db.queryOne<ImageModel>(sql, [id]);
    return image || null;
  } catch (error) {
    console.error(`[图片存储库] 获取图片失败: ${id}`, error);
    return null;
  }
}

/**
 * 根据路径获取图片
 * @param path 图片路径
 * @returns 图片信息
 */
export async function getImageByPath(path: string): Promise<ImageModel | null> {
  try {
    const sql = `SELECT * FROM images WHERE path = ?`;
    const image = await db.queryOne<ImageModel>(sql, [path]);
    return image || null;
  } catch (error) {
    console.error(`[图片存储库] 获取图片失败: ${path}`, error);
    return null;
  }
}

/**
 * 获取文章的所有图片
 * @param postId 文章ID
 * @returns 图片列表
 */
export async function getImagesByPostId(postId: number): Promise<ImageModel[]> {
  try {
    const sql = `SELECT * FROM images WHERE post_id = ? ORDER BY created_at DESC`;
    return await db.query<ImageModel>(sql, [postId]);
  } catch (error) {
    console.error(`[图片存储库] 获取文章图片失败: ${postId}`, error);
    return [];
  }
}

/**
 * 获取所有图片
 * @param options 查询选项
 * @returns 图片列表和总数
 */
export async function getAllImages(options: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ images: ImageModel[], total: number }> {
  const {
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  try {
    // 获取总数
    const countResult = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM images');
    const total = countResult?.count || 0;

    // 没有结果时直接返回
    if (total === 0) {
      return { images: [], total: 0 };
    }

    // 构建查询
    const validSortFields = ['created_at', 'updated_at', 'size', 'filename'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const sql = `
      SELECT * FROM images
      ORDER BY ${orderField} ${order}
      LIMIT ? OFFSET ?
    `;

    const images = await db.query<ImageModel>(sql, [limit, offset]);
    return { images, total };
  } catch (error) {
    console.error('[图片存储库] 获取所有图片失败:', error);
    return { images: [], total: 0 };
  }
}

/**
 * 更新图片信息
 * @param id 图片ID
 * @param image 图片信息
 * @returns 是否更新成功
 */
export async function updateImage(id: number, image: Partial<ImageModel>): Promise<boolean> {
  try {
    // 构建更新字段
    const updateFields: string[] = [];
    const params: any[] = [];

    if (image.post_id !== undefined) {
      updateFields.push('post_id = ?');
      params.push(image.post_id);
    }

    if (image.url !== undefined) {
      updateFields.push('url = ?');
      params.push(image.url);
    }

    // 添加更新时间
    updateFields.push('updated_at = ?');
    params.push(db.getCurrentTimestamp());

    // 添加ID参数
    params.push(id);

    // 如果没有更新字段，直接返回成功
    if (updateFields.length === 0) {
      return true;
    }

    // 构建SQL
    const sql = `
      UPDATE images
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    // 执行更新
    const result = await db.execute(sql, params);
    return result > 0;
  } catch (error) {
    console.error(`[图片存储库] 更新图片失败: ${id}`, error);
    return false;
  }
}

/**
 * 删除图片
 * @param id 图片ID
 * @returns 是否删除成功
 */
export async function deleteImage(id: number): Promise<boolean> {
  try {
    const sql = `DELETE FROM images WHERE id = ?`;
    const result = await db.execute(sql, [id]);
    return result > 0;
  } catch (error) {
    console.error(`[图片存储库] 删除图片失败: ${id}`, error);
    return false;
  }
}

/**
 * 获取未关联文章的图片
 * @returns 未关联图片列表
 */
export async function getOrphanedImages(): Promise<ImageModel[]> {
  try {
    const sql = `SELECT * FROM images WHERE post_id IS NULL ORDER BY created_at DESC`;
    return await db.query<ImageModel>(sql);
  } catch (error) {
    console.error('[图片存储库] 获取未关联图片失败:', error);
    return [];
  }
}

/**
 * 批量删除图片
 * @param ids 图片ID列表
 * @returns 删除成功的数量
 */
export async function batchDeleteImages(ids: number[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  try {
    // 使用事务确保原子性
    return await db.withTransaction(async () => {
      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM images WHERE id IN (${placeholders})`;
      const result = await db.execute(sql, ids);
      return result;
    });
  } catch (error) {
    console.error('[图片存储库] 批量删除图片失败:', error);
    return 0;
  }
} 