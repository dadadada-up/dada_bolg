import { NextResponse } from "next/server";
import { isVercelEnv } from '@/lib/db/env-config';
import fs from 'fs';
import path from 'path';

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
  schemaInitialized?: boolean;
  schemaError?: string;
  hasRequiredTables: boolean;
  missingTables?: string[];
  recordCounts?: {
    posts: number;
    categories: number;
    tags: number;
  };
  countError?: string;
  [key: string]: any; // 允许添加其他属性
}

// 检查数据库连接状态
export async function GET(request: Request) {
  // 在Vercel环境中返回模拟数据
  if (isVercelEnv) {
    console.log('[数据库状态API] 检测到Vercel环境，返回模拟数据');
    return Response.json({
      initialized: true,
      error: null,
      timestamp: new Date().toISOString(),
      dbPaths: [],
      tables: [
        { name: 'posts', type: 'table' },
        { name: 'categories', type: 'table' },
        { name: 'tags', type: 'table' },
        { name: 'post_categories', type: 'table' },
        { name: 'post_tags', type: 'table' }
      ],
      hasRequiredTables: true,
      environment: {
        isVercel: true,
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        cwd: process.cwd()
      },
      recordCounts: {
        posts: 0,
        categories: 0,
        tags: 0
      }
    });
  }

  try {
    // 解析查询参数，检查是否需要初始化
    const { searchParams } = new URL(request.url);
    const initSchema = searchParams.get('init') === 'true';
    
    // 初始化数据库
    console.log('[数据库状态API] 尝试初始化数据库连接');
    
    let dbInitializationSuccess = false;
    let initError = null;
    
    try {
      // 动态导入数据库相关模块
      const { initializeDatabase } = await import('@/lib/db/database');
      await initializeDatabase();
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
      hasRequiredTables: false, // 默认为false，后面会根据实际情况更新
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
    
    // 如果数据库初始化成功
    if (dbInitializationSuccess) {
      try {
        // 动态导入查询函数
        const { query } = await import('@/lib/db/database');
        const { initializeSchema } = await import('@/lib/db/init-schema');
        
        // 获取表信息
        const tables = await query("SELECT name, type FROM sqlite_master WHERE type='table'");
        status.tables = tables;
        
        // 如果请求了初始化表结构
        if (initSchema) {
          try {
            console.log('[数据库状态API] 尝试初始化数据库表结构');
            await initializeSchema();
            status.schemaInitialized = true;
            
            // 重新获取表信息
            const updatedTables = await query("SELECT name, type FROM sqlite_master WHERE type='table'");
            status.tables = updatedTables;
          } catch (schemaError) {
            console.error('[数据库状态API] 初始化表结构失败:', schemaError);
            status.schemaInitialized = false;
            status.schemaError = schemaError instanceof Error ? schemaError.message : String(schemaError);
          }
        }
        
        // 检查必要的表是否存在
        const requiredTables = ['posts', 'categories', 'tags', 'post_categories', 'post_tags'];
        const existingTables = status.tables.map((t: any) => t.name);
        
        status.missingTables = requiredTables.filter(t => !existingTables.includes(t));
        status.hasRequiredTables = status.missingTables.length === 0;
        
        // 获取表中的记录数
        if (status.hasRequiredTables) {
          try {
            const [postCount, categoryCount, tagCount] = await Promise.all([
              query("SELECT COUNT(*) as count FROM posts"),
              query("SELECT COUNT(*) as count FROM categories"),
              query("SELECT COUNT(*) as count FROM tags")
            ]);
            
            status.recordCounts = {
              posts: postCount[0]?.count || 0,
              categories: categoryCount[0]?.count || 0,
              tags: tagCount[0]?.count || 0
            };
          } catch (countError) {
            console.error('[数据库状态API] 获取记录数失败:', countError);
            status.countError = countError instanceof Error ? countError.message : String(countError);
          }
        }
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