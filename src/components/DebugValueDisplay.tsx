'use client';

import React from 'react';

interface DebugValueDisplayProps {
  value: any;
  label?: string;
}

/**
 * 调试组件，用于显示传入的实际值
 */
export function DebugValueDisplay({ value, label = '值' }: DebugValueDisplayProps) {
  // 获取值的类型
  const valueType = typeof value;
  
  // 获取值的字符表示
  let valueStr = '';
  try {
    if (value === null) {
      valueStr = 'null';
    } else if (value === undefined) {
      valueStr = 'undefined';
    } else if (typeof value === 'object') {
      valueStr = JSON.stringify(value);
    } else {
      valueStr = String(value);
    }
  } catch (err) {
    const error = err as Error;
    valueStr = `[无法序列化: ${error.message}]`;
  }
  
  // 截断过长的字符串
  const truncatedValue = valueStr.length > 500 ? valueStr.substring(0, 500) + '...' : valueStr;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded my-2">
      <div className="flex justify-between items-center mb-1">
        <div className="font-bold text-yellow-800">{label} 调试信息</div>
        <div className="text-xs bg-yellow-200 px-2 py-1 rounded text-yellow-800">
          类型: {valueType}
        </div>
      </div>
      <div className="text-yellow-700 text-sm mt-1">
        <div>长度: {valueStr.length}</div>
        <div>空值: {!value ? '是' : '否'}</div>
        <div>空字符串: {value === '' ? '是' : '否'}</div>
      </div>
      <pre className="bg-white p-2 rounded mt-1 text-xs max-h-40 overflow-auto border border-yellow-200">
        {truncatedValue}
      </pre>
    </div>
  );
} 