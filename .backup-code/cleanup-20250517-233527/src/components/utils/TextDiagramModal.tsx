'use client';

import React, { useState } from 'react';
import { DiagramSelector, DiagramOption } from './DiagramSelector';

interface TextDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (code: string, language: string) => void;
}

export function TextDiagramModal({ isOpen, onClose, onInsert }: TextDiagramModalProps) {
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramOption | null>(null);
  const [diagramCode, setDiagramCode] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'select' | 'edit'>('select');
  
  // 重置状态
  const handleClose = () => {
    setSelectedDiagram(null);
    setDiagramCode('');
    setCurrentStep('select');
    onClose();
  };
  
  // 选择图表类型
  const handleSelectDiagram = (diagram: DiagramOption) => {
    setSelectedDiagram(diagram);
    setDiagramCode(diagram.template);
    setCurrentStep('edit');
  };
  
  // 插入图表到编辑器
  const handleInsert = () => {
    if (!selectedDiagram) return;
    
    // 根据图表类型确定语言标识
    let language = 'mermaid'; // 默认为mermaid
    
    if (selectedDiagram.id.startsWith('plantuml')) {
      language = 'plantuml';
    } else if (selectedDiagram.id.startsWith('graphviz')) {
      language = 'graphviz';
    } else if (selectedDiagram.id.startsWith('flowchart')) {
      language = 'flowchart';
    }
    
    onInsert(diagramCode, language);
    handleClose();
  };
  
  // 返回选择页面
  const handleBack = () => {
    setCurrentStep('select');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* 模态框头部 */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {currentStep === 'select' ? '选择图表类型' : '编辑图表'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 模态框内容 */}
        <div className="p-6">
          {currentStep === 'select' ? (
            <DiagramSelector onSelect={handleSelectDiagram} />
          ) : (
            <div className="diagram-editor">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedDiagram?.icon}
                  <h3 className="font-medium">{selectedDiagram?.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  编辑下面的代码来自定义您的图表。图表将使用 <code className="bg-gray-100 px-1 rounded">{selectedDiagram?.id.split('-')[0]}</code> 语法渲染。
                </p>
                <textarea
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  className="w-full h-64 p-4 border rounded-md font-mono text-sm"
                  placeholder="在此输入图表代码..."
                />
              </div>
              
              <div className="diagram-preview border rounded-md p-4 bg-gray-50">
                <div className="mb-2 text-sm font-medium text-gray-700">预览</div>
                <div className="text-xs text-gray-500 mb-4">
                  预览功能将在下一个版本提供。目前，您可以插入图表代码并在编辑器中查看渲染结果。
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 模态框底部 */}
        <div className="p-4 border-t flex justify-end gap-3">
          {currentStep === 'edit' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            >
              返回选择
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
          {currentStep === 'edit' && (
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              插入图表
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 