import { NextResponse } from "next/server";
import { clearContentCache, forceRefreshAllData } from "@/lib/github";
import { revalidatePath } from "next/cache";

export async function POST() {
  try {
    // 清除所有内容缓存
    clearContentCache();
    
    // 清除分类缓存
    revalidatePath('/api/categories/db-categories');
    revalidatePath('/api/categories-new/db-categories');
    revalidatePath('/admin/categories');
    
    // 强制刷新所有数据
    const refreshed = await forceRefreshAllData();
    
    if (refreshed) {
      console.log('[API] 所有数据已成功刷新');
      return Response.json({ success: true, message: "刷新成功" });
    } else {
      console.error('[API] 数据刷新失败');
      return Response.json(
        { success: false, error: "刷新失败，请稍后再试" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] 刷新API错误:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "未知错误" 
      },
      { status: 500 }
    );
  }
} 