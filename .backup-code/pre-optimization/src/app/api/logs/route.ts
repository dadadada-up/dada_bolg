import { NextResponse } from 'next/server';
import logger, { LogLevel, getRecentLogs, setLogLevel } from '@/lib/utils/logger';

/**
 * 获取系统日志
 * 支持参数:
 * - count: 获取日志条数，默认100
 * - level: 最低日志级别(debug, info, warn, error, fatal)，默认debug
 */
export async function GET(request: Request) {
  try {
    // 获取URL参数
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const levelParam = url.searchParams.get('level')?.toLowerCase();
    
    // 解析日志数量
    const count = countParam ? parseInt(countParam, 10) : 100;
    
    // 解析日志级别
    let level = LogLevel.DEBUG;
    if (levelParam) {
      switch (levelParam) {
        case 'debug': level = LogLevel.DEBUG; break;
        case 'info': level = LogLevel.INFO; break;
        case 'warn': level = LogLevel.WARN; break;
        case 'error': level = LogLevel.ERROR; break;
        case 'fatal': level = LogLevel.FATAL; break;
      }
    }
    
    // 获取日志
    const logs = getRecentLogs(count, level);
    
    // 记录API调用
    logger.debug('logs-api', `获取日志，数量: ${count}, 最低级别: ${LogLevel[level]}`);
    
    return Response.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString() // 转换为ISO字符串
      })),
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('logs-api', '获取日志失败', error);
    
    return Response.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '获取日志失败',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

/**
 * 设置日志级别
 * 请求体格式:
 * { "level": "debug" | "info" | "warn" | "error" | "fatal" }
 */
export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const levelName = body.level?.toLowerCase();
    
    if (!levelName) {
      return Response.json(
        { 
          success: false, 
          message: '缺少level参数',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }
    
    // 映射日志级别
    let level: LogLevel;
    switch (levelName) {
      case 'debug': level = LogLevel.DEBUG; break;
      case 'info': level = LogLevel.INFO; break;
      case 'warn': level = LogLevel.WARN; break;
      case 'error': level = LogLevel.ERROR; break;
      case 'fatal': level = LogLevel.FATAL; break;
      default:
        return Response.json(
          { 
            success: false, 
            message: `无效的日志级别: ${levelName}`,
            validLevels: ['debug', 'info', 'warn', 'error', 'fatal'],
            timestamp: new Date().toISOString()
          }, 
          { status: 400 }
        );
    }
    
    // 设置日志级别
    setLogLevel(level);
    
    logger.info('logs-api', `日志级别已设置为: ${LogLevel[level]}`);
    
    return Response.json({
      success: true,
      message: `日志级别已设置为: ${LogLevel[level]}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('logs-api', '设置日志级别失败', error);
    
    return Response.json(
      { 
        success: false, 
        message: '设置日志级别失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 