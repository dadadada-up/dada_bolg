import { NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/db/database";

// 检查数据库连接状态
export async function GET(request: Request) {
  try {
    console.log("[数据库状态API] 检查数据库连接...");
    
    // 尝试初始化数据库连接
    await initializeDatabase();
    
    // 尝试执行一个简单的查询
    const db = await getDatabase();
    const result = await db.get("SELECT 1 as test");
    
    return Response.json({
      status: "success",
      message: "数据库连接正常",
      timestamp: new Date().toISOString(),
      test: result,
      db_type: process.env.TURSO_DATABASE_URL ? "Turso" : "SQLite"
    });
  } catch (error) {
    console.error("[数据库状态API] 数据库连接失败:", error);
    
    return Response.json({
      status: "error",
      message: "数据库连接失败",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 