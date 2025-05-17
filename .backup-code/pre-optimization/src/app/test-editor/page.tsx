'use client';

import React, { useState } from 'react';
import { SimpleEditor } from '@/components/utils/SimpleEditor';
import { AdvancedEditor } from '@/components/utils/AdvancedEditor';

export default function TestEditorPage() {
  const [simpleContent, setSimpleContent] = useState('# 测试SimpleEditor\n\n这是用于测试优化后的编辑器界面。\n\n- 工具栏已重新组织\n- 添加了下拉菜单\n- 改进了工具提示\n- 优化了移动端支持');
  
  const [advancedContent, setAdvancedContent] = useState('# 测试AdvancedEditor\n\n这是用于测试带有预览功能的高级编辑器。\n\n## 二级标题\n\n内容示例。\n\n### 三级标题\n\n更多内容。');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">编辑器界面测试</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">简单编辑器 (优化后的工具栏)</h2>
        <SimpleEditor 
          value={simpleContent}
          onChange={setSimpleContent}
          height={300}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">高级编辑器 (分屏预览)</h2>
        <AdvancedEditor
          value={advancedContent}
          onChange={setAdvancedContent}
          height={400}
        />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-medium mb-2">SimpleEditor新特性说明</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>工具栏按优先级分组，常用工具直接显示</li>
          <li>高级功能放入下拉菜单，减少界面拥挤</li>
          <li>悬停提示更加清晰，显示快捷键</li>
          <li>增加了分组视觉界限，提高可识别性</li>
          <li>移动端自适应布局，自动合并功能</li>
        </ul>
      </div>
    </div>
  );
} 