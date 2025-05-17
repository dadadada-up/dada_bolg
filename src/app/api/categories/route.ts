import { NextResponse } from 'next/server';
import { fallbackCategories } from '@/lib/fallback-data';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { query, queryOne, execute } from '@/lib/db/database';
import { getAllCategoryMappings } from '@/lib/github/index';

export async function GET(request: Request) {
  try {
    console.log('[API] 获取所有分类');
    
    // 优先尝试从数据库获取分类
    if (isTursoEnabled()) {
      try {
        console.log('[Turso] 尝试从数据库获取分类');
        
        // 从数据库获取分类
        const sql = `SELECT id, name, slug, description FROM categories ORDER BY name`;
        const dbCategories = await query(sql);
        
        if (dbCategories && dbCategories.length > 0) {
          console.log(`[Turso] 从数据库成功获取 ${dbCategories.length} 个分类`);
          return Response.json(dbCategories);
        }
      } catch (dbError) {
        console.error('[Turso] 从数据库获取分类失败:', dbError);
      }
    }
    
    // 尝试使用getAllCategoryMappings
    try {
      const mappings = await getAllCategoryMappings();
      if (mappings && mappings.length > 0) {
        console.log(`[API] 使用分类映射: ${mappings.length} 个分类`);
        return Response.json(mappings);
      }
    } catch (mappingError) {
      console.error('[API] 获取分类映射失败:', mappingError);
    }
    
    // 最后使用备用数据
    console.log('[API] 使用备用分类数据');
    return Response.json(fallbackCategories);
  } catch (error) {
    console.error('获取分类失败:', error);
    // 最后的回退
    return Response.json(
      fallbackCategories, 
      { status: 200 }
    );
  }
} 