'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
  targetId?: string;
}

export function Mermaid({ chart, targetId }: MermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
    
    const renderChart = async () => {
      try {
        if (targetId) {
          // 如果提供了targetId，渲染到指定元素
          const target = document.getElementById(targetId);
          if (target) {
            target.classList.add('mermaid');
            target.textContent = chart;
            await mermaid.run();
          }
        } else if (mermaidRef.current) {
          // 否则渲染到当前组件
          mermaidRef.current.textContent = chart;
          await mermaid.run();
        }
      } catch (error) {
        console.error('Mermaid渲染失败:', error, chart);
      }
    };
    
    renderChart();
  }, [chart, targetId]);

  // 如果提供了targetId，不渲染本地容器
  if (targetId) {
    return null;
  }

  return (
    <div className="mermaid-wrapper overflow-auto my-6">
      <div className="mermaid" ref={mermaidRef}></div>
    </div>
  );
}

export default Mermaid; 