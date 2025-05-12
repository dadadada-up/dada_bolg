import { NextResponse } from 'next/server';
import * as tagRepository from '@/lib/db/repositories/tag-repository';

export async function GET() {
  try {
    console.log('[API] 开始获取标签数据');
    
    // 获取所有标签
    const tags = await tagRepository.getAllTags();
    
    console.log(`[API] 返回 ${tags.length} 个标签`);
    
    return Response.json(tags);
  } catch (error) {
    console.error('[API] 获取标签失败:', error);
    return Response.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
} 