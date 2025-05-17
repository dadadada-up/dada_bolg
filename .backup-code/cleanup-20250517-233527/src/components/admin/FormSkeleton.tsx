'use client';

import React from 'react';

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* 标题骨架 */}
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      
      {/* 编辑器工具栏骨架 */}
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      
      {/* 内容区域骨架 */}
      <div className="space-y-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
      
      {/* 侧边栏表单骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {/* 表单字段组 */}
          <div className="space-y-2">
            <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* 第二列表单字段 */}
          <div className="space-y-2">
            <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>
      </div>
      
      {/* 按钮组骨架 */}
      <div className="flex space-x-4 pt-4">
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    </div>
  );
} 