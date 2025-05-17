/**
 * remark-admonitions - 处理Markdown中的警告、提示、信息等特殊区块
 * 支持的语法:
 * :::info
 * 内容
 * :::
 * 
 * :::warning
 * 内容
 * :::
 * 
 * :::tip
 * 内容
 * :::
 */

import { visit, SKIP } from 'unist-util-visit';
import { Node } from 'unist';

// 完全重写admonitions处理逻辑，确保正确识别和渲染
export default function remarkAdmonitions() {
  return (tree: Node) => {
    // 遍历文本和段落节点，这样可以更好地捕获完整的admonition块
    visit(tree, 'paragraph', (node: any, index: number, parent: any) => {
      handleAdmonitionNode(node, index, parent);
    });
    
    visit(tree, 'text', (node: any, index: number, parent: any) => {
      handleAdmonitionNode(node, index, parent);
    });
  };
}

// 单独提取处理函数，以解决类型问题
function handleAdmonitionNode(node: any, index: number, parent: any) {
  // 只处理文本节点或包含文本子节点的段落节点
  if (!node || 
      (node.type === 'text' && (!node.value || typeof node.value !== 'string')) ||
      (node.type === 'paragraph' && (!node.children || !node.children.length))) {
    return;
  }
  
  // 获取节点内容
  const nodeContent = node.type === 'text' ? node.value : 
                      node.children.map((child: any) => child.value || '').join('');
  
  // 检查是否包含admonition语法开始
  if (!nodeContent.includes(':::')) return;

  try {
    // 尝试解析完整的admonition块
    if (node.type === 'paragraph' && node.children) {
      // 查找第一个包含:::的子节点
      const startNodeIndex = node.children.findIndex((child: any) => 
        child.value && child.value.includes(':::'));
      
      if (startNodeIndex === -1) return;
      
      // 提取开始标记部分的内容
      const startContent = node.children[startNodeIndex].value;
      const startMatch = startContent.match(/^:::(\w+)(?:\s+(.*?))?$/m);
      
      if (!startMatch) return;
      
      // 找到了有效的开始标记
      const type = startMatch[1]; // info, warning, tip 等
      const title = startMatch[2] || type.charAt(0).toUpperCase() + type.slice(1);
      
      // 收集admonition内容
      const contentParts: string[] = [];
      let endNodeIndex = -1;
      
      // 查找结束标记并收集内容
      for (let i = startNodeIndex + 1; i < node.children.length; i++) {
        const childContent = node.children[i].value;
        if (childContent && childContent.includes(':::') && /^:::$/.test(childContent.trim())) {
          endNodeIndex = i;
          break;
        }
        contentParts.push(childContent);
      }
      
      // 如果找到了完整的admonition块
      if (endNodeIndex > startNodeIndex) {
        const content = contentParts.join('\n').trim();
        
        // 设置样式和图标
        const typeToEmoji: Record<string, string> = {
          info: '💡',
          warning: '⚠️',
          tip: '💪',
          note: '📝',
          caution: '🔥',
          danger: '☢️',
          important: '❗'
        };
        
        const typeToClass: Record<string, string> = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          tip: 'bg-green-50 border-green-200 text-green-800',
          note: 'bg-gray-50 border-gray-200 text-gray-800',
          caution: 'bg-red-50 border-red-200 text-red-800',
          danger: 'bg-red-100 border-red-300 text-red-900',
          important: 'bg-purple-50 border-purple-200 text-purple-800'
        };
        
        const emoji = typeToEmoji[type] || '💡';
        const className = typeToClass[type] || 'bg-blue-50 border-blue-200 text-blue-800';
        
        // 创建HTML节点
        const htmlNode = {
          type: 'html',
          value: `
<div class="admonition ${type} my-6 p-6 border rounded-lg ${className}">
  <div class="admonition-header flex items-center mb-3 font-semibold">
    <span class="admonition-icon mr-2">${emoji}</span>
    <span class="admonition-title">${title}</span>
  </div>
  <div class="admonition-content">
    <p>${content}</p>
  </div>
</div>
          `.trim()
        };
        
        // 替换原始节点
        parent.children.splice(index, 1, htmlNode);
        return [SKIP, index];
      }
    }
    
    // 单行文本节点处理 - 针对直接包含完整admonition块的文本节点
    if (node.type === 'text' && node.value) {
      const textContent = node.value;
      const admonitionRegex = /^:::(info|warning|tip|note|caution|danger|important)(?:\s+(.*?))?\n([\s\S]*?):::$/gm;
      
      // 如果没有匹配到完整的admonition模式，跳过
      if (!admonitionRegex.test(textContent)) return;
      
      // 重置regex状态（因为test方法会改变lastIndex）
      admonitionRegex.lastIndex = 0;
      
      const newNodes: any[] = [];
      let lastIndex = 0;
      let match;
      
      // 查找所有admonition块
      while ((match = admonitionRegex.exec(textContent)) !== null) {
        // 保存admonition前的普通文本
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: textContent.slice(lastIndex, match.index)
          });
        }
        
        // 提取admonition信息
        const type = match[1];
        const title = match[2] || type.charAt(0).toUpperCase() + type.slice(1);
        const content = match[3].trim();
        
        // 设置样式和图标
        const typeToEmoji: Record<string, string> = {
          info: '💡',
          warning: '⚠️',
          tip: '💪',
          note: '📝',
          caution: '🔥',
          danger: '☢️',
          important: '❗'
        };
        
        const typeToClass: Record<string, string> = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          tip: 'bg-green-50 border-green-200 text-green-800',
          note: 'bg-gray-50 border-gray-200 text-gray-800',
          caution: 'bg-red-50 border-red-200 text-red-800',
          danger: 'bg-red-100 border-red-300 text-red-900',
          important: 'bg-purple-50 border-purple-200 text-purple-800'
        };
        
        const emoji = typeToEmoji[type] || '💡';
        const className = typeToClass[type] || 'bg-blue-50 border-blue-200 text-blue-800';
        
        // 创建HTML节点
        newNodes.push({
          type: 'html',
          value: `
<div class="admonition ${type} my-6 p-6 border rounded-lg ${className}">
  <div class="admonition-header flex items-center mb-3 font-semibold">
    <span class="admonition-icon mr-2">${emoji}</span>
    <span class="admonition-title">${title}</span>
  </div>
  <div class="admonition-content">
    <p>${content}</p>
  </div>
</div>
          `.trim()
        });
        
        lastIndex = match.index + match[0].length;
      }
      
      // 添加剩余的文本
      if (lastIndex < textContent.length) {
        newNodes.push({
          type: 'text',
          value: textContent.slice(lastIndex)
        });
      }
      
      // 替换原始节点
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
        return [SKIP, index + newNodes.length - 1];
      }
    }
  } catch (error) {
    console.error('处理admonition时出错:', error);
  }
} 