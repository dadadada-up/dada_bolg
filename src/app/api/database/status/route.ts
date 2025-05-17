import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/database";
import initializeDb from "@/lib/db";
import fs from 'fs';
import path from 'path';
import { getDbStatus } from '@/lib/db';
import { query } from '@/lib/db/database';

// 数据库文件路径选项
const DB_PATH_OPTIONS = [
  process.env.DB_PATH,
  path.resolve(process.cwd(), 'data', 'blog.db'),
  path.resolve(process.cwd(), 'data', 'storage', 'blog.db')
];

// 定义状态接口
interface DBPathInfo {
  path: string;
  exists: boolean;
  size: number | null;
  permissions: string | null;
  isDirectory: boolean | null;
}

interface DirectoryInfo {
  path: string;
  exists: boolean;
  isDirectory?: boolean;
  permissions?: string;
  writable?: boolean;
  writeError?: string;
  created?: boolean;
  createError?: string;
}

interface DbStatusResponse {
  initialized: boolean;
  error: string | null;
  timestamp: string;
  dbPaths: DBPathInfo[];
  tables: any[];
  tableError?: string;
  dataDirectory?: DirectoryInfo;
  environment: {
    isVercel: boolean;
    nodeEnv: string | undefined;
    platform: string;
    cwd: string;
  };
  [key: string]: any; // 允许添加其他属性
}

// 检查数据库连接状态
export async function GET() {
  try {
    // 初始化数据库
    console.log('[数据库状态API] 尝试初始化数据库连接');
    
    let dbInitializationSuccess = false;
    let initError = null;
    
    try {
      await initializeDb();
      dbInitializationSuccess = true;
    } catch (error) {
      initError = error;
      console.error('[数据库状态API] 数据库初始化失败:', error);
    }
    
    // 获取详细的数据库状态
    const status: DbStatusResponse = {
      initialized: dbInitializationSuccess,
      error: initError ? (initError instanceof Error ? initError.message : String(initError)) : null,
      timestamp: new Date().toISOString(),
      dbPaths: [],
      tables: [],
      environment: {
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        cwd: process.cwd()
      }
    };
    
    // 检查各个可能的数据库文件路径
    for (const dbPath of DB_PATH_OPTIONS) {
      if (dbPath) {
        const exists = fs.existsSync(dbPath);
        const stats = exists ? fs.statSync(dbPath) : null;
        
        status.dbPaths.push({
          path: dbPath,
          exists,
          size: stats ? stats.size : null,
          permissions: stats ? (stats.mode & parseInt('777', 8)).toString(8) : null,
          isDirectory: stats ? stats.isDirectory() : null
        });
      }
    }
    
    // 如果数据库初始化成功，获取表信息
    if (dbInitializationSuccess) {
      try {
        const tables = await query("SELECT name, type FROM sqlite_master WHERE type='table'");
        status.tables = tables;
        
        // 获取更多数据库状态
        const dbStatus = await getDbStatus();
        Object.assign(status, dbStatus);
      } catch (tableError) {
        console.error('[数据库状态API] 获取表结构失败:', tableError);
        status.tableError = tableError instanceof Error ? tableError.message : String(tableError);
      }
    }
    
    // 检查数据目录的权限
    const dataDir = path.join(process.cwd(), 'data');
    
    if (fs.existsSync(dataDir)) {
      const dataDirStats = fs.statSync(dataDir);
      
      status.dataDirectory = {
        path: dataDir,
        exists: true,
        isDirectory: dataDirStats.isDirectory(),
        permissions: (dataDirStats.mode & parseInt('777', 8)).toString(8),
        writable: true
      };
      
      // 测试目录的写入权限
      const testFile = path.join(dataDir, '.test-write');
      try {
        fs.writeFileSync(testFile, 'test', 'utf8');
        fs.unlinkSync(testFile);
      } catch (writeError) {
        if (status.dataDirectory) {
          status.dataDirectory.writable = false;
          status.dataDirectory.writeError = writeError instanceof Error ? writeError.message : String(writeError);
        }
      }
    } else {
      status.dataDirectory = {
        path: dataDir,
        exists: false
      };
      
      // 尝试创建数据目录
      try {
        fs.mkdirSync(dataDir, { recursive: true });
        if (status.dataDirectory) {
          status.dataDirectory.created = true;
        }
      } catch (mkdirError) {
        if (status.dataDirectory) {
          status.dataDirectory.created = false;
          status.dataDirectory.createError = mkdirError instanceof Error ? mkdirError.message : String(mkdirError);
        }
      }
    }
    
    return Response.json(status);
  } catch (error) {
    console.error('[数据库状态API] 获取状态失败:', error);
    
    return Response.json(
      {
        error: '获取数据库状态失败',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 