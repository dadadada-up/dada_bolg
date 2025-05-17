import { NextResponse } from "next/server";
import { getDb, getTimestamp } from "@/lib/db";
import initializeDatabase from "@/lib/db";

// 确保数据库初始化
initializeDatabase();

export async function POST(request: Request) {
  try {
    const db = await getDb();
    
    // 创建同步状态表，如果不存在
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_sync_time INTEGER,
        total_posts INTEGER DEFAULT 0,
        total_categories INTEGER DEFAULT 0,
        total_tags INTEGER DEFAULT 0,
        sync_in_progress INTEGER DEFAULT 0
      )
    `);
    
    // 检查同步状态记录是否存在
    const syncStatus = await db.get("SELECT * FROM sync_status WHERE id = 1");
    
    if (syncStatus) {
      // 重置同步状态
      await db.run(
        "UPDATE sync_status SET sync_in_progress = 0, last_sync_time = ? WHERE id = 1",
        [getTimestamp()]
      );
      console.log("[同步] 同步状态已重置");
    } else {
      // 创建初始同步状态记录
      await db.run(
        "INSERT INTO sync_status (id, last_sync_time, sync_in_progress) VALUES (1, ?, 0)",
        [getTimestamp()]
      );
      console.log("[同步] 已创建新的同步状态记录");
    }
    
    return Response.json({
      success: true,
      message: "同步状态已重置",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[同步] 重置同步状态失败:", error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : "重置同步状态失败",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 也支持GET方法以便于测试
export async function GET(request: Request) {
  return POST(request);
}
