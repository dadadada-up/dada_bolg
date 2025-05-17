'use client';

import { useState } from 'react';
import Select from 'react-select';
import { XCircle } from 'lucide-react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  suggestions?: string[];
  placeholder?: string;
}

export function TagInput({
  label,
  value,
  onChange,
  required = false,
  suggestions = [],
  placeholder = '输入并按回车添加'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  // 从建议中创建选项
  const options = suggestions.map(s => ({ label: s, value: s }));
  
  // 当前选中的标签
  const selectedOptions = value.map(tag => ({ label: tag, value: tag }));

  // 处理新标签的添加
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  // 处理按键事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!inputValue) return;
    
    // 当按下回车键时
    if (event.key === 'Enter') {
      event.preventDefault();
      // 添加标签并清空输入
      if (inputValue.trim() && !value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // 添加标签（从下拉菜单选择）
  const handleChange = (selectedOptions: any) => {
    if (selectedOptions) {
      onChange(selectedOptions.map((option: any) => option.value));
    } else {
      onChange([]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* 已选标签的视觉展示 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <div 
            key={tag} 
            className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              <XCircle size={16} />
            </button>
          </div>
        ))}
      </div>
      
      {/* 标签输入和建议 */}
      <div className="flex">
        {suggestions.length > 0 ? (
          <Select
            isMulti
            options={options}
            value={selectedOptions}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full"
            classNamePrefix="react-select"
          />
        ) : (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={placeholder}
          />
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        输入标签后按 Enter 添加
      </p>
    </div>
  );
} 