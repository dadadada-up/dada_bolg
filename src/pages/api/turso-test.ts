/**
 * Turso数据库连接测试API
 * 路径: /api/turso-test
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '@/lib/db/database';

type TursoTestResponse = {
  status: string;
  message: string;
  database?: string;
  timestamp?: string;
  query_result?: any;
  error?: string;
  result?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TursoTestResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: '仅支持GET请求' });
  }

  try {
    // 获取数据库连接
    const db = await getDatabase();
    
    // 执行简单查询
    const result = await db.get('SELECT 1 as test');
    
    // 如果查询成功，返回成功响应
    if (result && result.test === 1) {
      return res.status(200).json({
        status: 'success',
        message: 'Turso数据库连接正常',
        database: process.env.TURSO_DATABASE_URL ? '使用Turso数据库' : '使用本地SQLite数据库',
        timestamp: new Date().toISOString(),
        query_result: result
      });
    } else {
      // 查询结果不符合预期
      return res.status(500).json({
        status: 'error',
        message: '数据库查询返回异常结果',
        result: result
      });
    }
  } catch (error) {
    // 捕获并返回错误信息
    console.error('Turso测试API错误:', error);
    return res.status(500).json({
      status: 'error',
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 