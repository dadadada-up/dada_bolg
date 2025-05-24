import path from 'path';
import { Database } from './types';
import { isVercelEnv } from './env-config';

export class SQLiteDatabase implements Database {
  private db: any;
  private initialized: boolean = false;
  private isBuildTime: boolean;

  constructor() {
    // 检查是否在构建时
    this.isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    
    // 在Vercel环境中不要尝试初始化SQLite
    if (!isVercelEnv) {
      // 非构建时才初始化
      if (!this.isBuildTime) {
        this.initialize();
      } else {
        console.log('[SQLite] 构建时不初始化SQLite');
      }
    } else {
      console.log('[SQLite] 在Vercel环境中不初始化SQLite');
    }
  }

  private async initialize() {
    if (this.initialized) return;
    if (isVercelEnv) {
      throw new Error('在Vercel环境中不支持SQLite');
    }

    try {
      // 动态导入sqlite模块，避免在构建时加载
      let sqlite3Module;
      let sqliteModule;
      
      try {
        // 尝试导入sqlite3
        sqlite3Module = await import('sqlite3');
        sqliteModule = await import('sqlite');
      } catch (err) {
        console.error('[SQLite] 导入sqlite3失败，尝试使用better-sqlite3', err);
        throw err;
      }
      
      const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
      console.log(`[SQLite] 连接数据库: ${dbPath}`);
      
      this.db = await sqliteModule.open({
        filename: dbPath,
        driver: sqlite3Module.default.Database
      });

      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');
      this.initialized = true;
      console.log('[SQLite] 数据库连接成功');
    } catch (error) {
      console.error('[SQLite] 数据库连接失败:', error);
      throw error;
    }
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (isVercelEnv || this.isBuildTime) {
      console.log('[SQLite] Vercel环境或构建时SQLite不可用，返回空数组');
      return [];
    }
    await this.initialize();
    return this.db.all(sql, params);
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (isVercelEnv || this.isBuildTime) {
      console.log('[SQLite] Vercel环境或构建时SQLite不可用，返回undefined');
      return undefined;
    }
    await this.initialize();
    return this.db.get(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (isVercelEnv || this.isBuildTime) {
      console.log('[SQLite] Vercel环境或构建时SQLite不可用，返回空结果');
      return { lastID: 0, changes: 0 };
    }
    await this.initialize();
    return this.db.run(sql, params);
  }

  async exec(sql: string): Promise<void> {
    if (isVercelEnv || this.isBuildTime) {
      console.log('[SQLite] Vercel环境或构建时SQLite不可用，跳过执行');
      return;
    }
    await this.initialize();
    return this.db.exec(sql);
  }

  async close(): Promise<void> {
    if (this.db && !isVercelEnv && !this.isBuildTime) {
      await this.db.close();
    }
  }
} 