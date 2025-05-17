/**
 * 博客系统统一日志模块
 * 提供统一的日志记录接口，支持不同级别的日志输出和格式化
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 默认日志级别
const DEFAULT_LOG_LEVEL = LogLevel.INFO;

// 当前日志级别
let currentLogLevel = DEFAULT_LOG_LEVEL;

// 日志颜色（控制台输出用）
const LOG_COLORS = {
  [LogLevel.DEBUG]: '\x1b[90m', // 灰色
  [LogLevel.INFO]: '\x1b[37m',  // 白色
  [LogLevel.WARN]: '\x1b[33m',  // 黄色
  [LogLevel.ERROR]: '\x1b[31m', // 红色
  [LogLevel.FATAL]: '\x1b[35m', // 紫色
  RESET: '\x1b[0m'              // 重置
};

// 日志级别名称
const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

// 日志记录(内存)
const memoryLogs: Array<{
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}> = [];

// 最大内存日志条数
const MAX_MEMORY_LOGS = 1000;

/**
 * 设置日志级别
 * @param level 日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
  log(LogLevel.INFO, 'logger', `日志级别已设置为: ${LOG_LEVEL_NAMES[level]}`);
}

/**
 * 获取当前日志级别
 * @returns 当前日志级别
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * 记录日志
 * @param level 日志级别
 * @param module 模块名称
 * @param message 日志消息
 * @param data 额外数据
 */
export function log(level: LogLevel, module: string, message: string, data?: any): void {
  // 如果日志级别低于当前设置，则不记录
  if (level < currentLogLevel) {
    return;
  }

  const timestamp = new Date();
  const formattedTime = formatDate(timestamp);
  
  // 控制台输出
  const color = LOG_COLORS[level];
  const levelName = LOG_LEVEL_NAMES[level];
  
  console.log(
    `${color}[${formattedTime}] [${levelName}] [${module}]${LOG_COLORS.RESET} ${message}`
  );
  
  // 对于错误级别，额外记录堆栈
  if (level >= LogLevel.ERROR && data instanceof Error) {
    console.error(`${LOG_COLORS[level]}${data.stack}${LOG_COLORS.RESET}`);
  } else if (data !== undefined) {
    // 打印其他数据
    try {
      console.log(data);
    } catch (err) {
      console.log('无法序列化的数据');
    }
  }
  
  // 添加到内存日志
  memoryLogs.push({
    timestamp,
    level,
    module,
    message,
    data
  });
  
  // 限制内存日志大小
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.shift();
  }
}

/**
 * 格式化日期时间
 * @param date 日期对象
 * @returns 格式化后的日期时间字符串
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 获取最近的日志
 * @param count 获取条数
 * @param level 最低日志级别
 * @returns 日志数组
 */
export function getRecentLogs(count = 100, level = LogLevel.DEBUG): Array<{
  timestamp: Date;
  level: LogLevel;
  levelName: string;
  module: string;
  message: string;
  data?: any;
}> {
  return memoryLogs
    .filter(log => log.level >= level)
    .slice(-count)
    .map(log => ({
      ...log,
      levelName: LOG_LEVEL_NAMES[log.level]
    }));
}

/**
 * 导出便捷日志函数
 */
export const debug = (module: string, message: string, data?: any) => 
  log(LogLevel.DEBUG, module, message, data);

export const info = (module: string, message: string, data?: any) => 
  log(LogLevel.INFO, module, message, data);

export const warn = (module: string, message: string, data?: any) => 
  log(LogLevel.WARN, module, message, data);

export const error = (module: string, message: string, data?: any) => 
  log(LogLevel.ERROR, module, message, data);

export const fatal = (module: string, message: string, data?: any) => 
  log(LogLevel.FATAL, module, message, data);

/**
 * 默认导出
 */
export default {
  debug,
  info,
  warn,
  error,
  fatal,
  setLogLevel,
  getLogLevel,
  getRecentLogs,
  LogLevel
}; 