'use client';

import React, { useState } from 'react';

export interface DiagramOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  template: string;
}

interface DiagramSelectorProps {
  onSelect: (diagram: DiagramOption) => void;
  onCancel?: () => void;
}

export function DiagramSelector({ onSelect, onCancel }: DiagramSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>('mermaid');
  
  // 图表类型选项
  const diagramTypes = [
    { value: 'mermaid', label: 'Mermaid' },
    { value: 'plantuml', label: 'PlantUML' },
    { value: 'graphviz', label: 'Graphviz' },
    { value: 'flowchart', label: 'Flowchart' },
  ];
  
  // 图表模板选项
  const diagramOptions: DiagramOption[] = [
    // Mermaid选项
    {
      id: 'mermaid-flowchart',
      name: '流程图',
      icon: <span className="text-2xl">📊</span>,
      template: `graph TD;
    A[开始] --> B[处理];
    B --> C{判断条件};
    C -->|是| D[处理1];
    C -->|否| E[处理2];
    D --> F[结束];
    E --> F;`,
    },
    {
      id: 'mermaid-sequence',
      name: '时序图',
      icon: <span className="text-2xl">🔄</span>,
      template: `sequenceDiagram
    参与者A->>参与者B: 你好，B!
    参与者B-->>参与者A: 你好，A!
    参与者A-)参与者B: 异步消息
    参与者A-x参与者B: 同步消息`,
    },
    {
      id: 'mermaid-class',
      name: '类图',
      icon: <span className="text-2xl">📋</span>,
      template: `classDiagram
    class Animal {
      +name: string
      +eat(): void
    }
    class Dog {
      +bark(): void
    }
    Animal <|-- Dog`,
    },
    {
      id: 'mermaid-state',
      name: '状态图',
      icon: <span className="text-2xl">🔀</span>,
      template: `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中
    处理中 --> 已完成
    已完成 --> [*]`,
    },
    {
      id: 'mermaid-gantt',
      name: '甘特图',
      icon: <span className="text-2xl">📆</span>,
      template: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 阶段1
    任务1 :a1, 2023-01-01, 7d
    任务2 :after a1, 5d
    section 阶段2
    任务3 :2023-01-12, 6d
    任务4 :2023-01-18, 5d`,
    },
    {
      id: 'mermaid-pie',
      name: '饼图',
      icon: <span className="text-2xl">🍰</span>,
      template: `pie
    title 产品使用分布
    "A产品" : 30
    "B产品" : 50
    "C产品" : 20`,
    },
    {
      id: 'mermaid-er',
      name: 'ER图',
      icon: <span className="text-2xl">🗃️</span>,
      template: `erDiagram
    用户 ||--o{ 订单 : 下单
    订单 ||--|{ 商品 : 包含
    用户 {
      int id
      string name
    }
    订单 {
      int id
      date created_at
    }`,
    },
    
    // PlantUML选项
    {
      id: 'plantuml-usecase',
      name: '用例图',
      icon: <span className="text-2xl">👤</span>,
      template: `@startuml
skinparam handwritten true

actor 用户
actor 管理员
database 数据库

用户 -> (登录)
用户 -> (查看文章)
管理员 --> (管理文章)
管理员 --> (管理用户)

(管理文章) -> 数据库
(管理用户) -> 数据库
@enduml`,
    },
    {
      id: 'plantuml-class',
      name: '类图',
      icon: <span className="text-2xl">📝</span>,
      template: `@startuml
class User {
  +String name
  +String email
  +login()
  +logout()
}

class Admin extends User {
  +manageUsers()
}

class Post {
  +String title
  +String content
  +Date createTime
}

User "1" -- "n" Post : creates
@enduml`,
    },
    {
      id: 'plantuml-activity',
      name: '活动图',
      icon: <span className="text-2xl">📋</span>,
      template: `@startuml
start
:用户登录;
if (验证通过?) then (yes)
  :进入系统;
  fork
    :查看文章;
  fork again
    :发表评论;
  end fork
else (no)
  :显示错误信息;
  :返回登录;
endif
stop
@enduml`,
    },
    {
      id: 'plantuml-sequence',
      name: '时序图',
      icon: <span className="text-2xl">⏱️</span>,
      template: `@startuml
用户 -> 前端: 提交登录表单
前端 -> 后端: 发送登录请求
后端 -> 数据库: 验证用户信息
数据库 --> 后端: 返回验证结果
alt 验证成功
  后端 --> 前端: 返回成功消息和令牌
  前端 --> 用户: 跳转到主页
else 验证失败
  后端 --> 前端: 返回错误消息
  前端 --> 用户: 显示错误提示
end
@enduml`,
    },
    
    // Graphviz选项
    {
      id: 'graphviz-digraph',
      name: '有向图',
      icon: <span className="text-2xl">📊</span>,
      template: `digraph G {
  rankdir=LR;
  node [shape=box];
  A -> B;
  B -> C;
  B -> D;
  D -> C;
}`,
    },
  ];
  
  // 筛选当前类型的图表选项
  const filteredOptions = diagramOptions.filter(option => 
    option.id.startsWith(selectedType)
  );
  
  return (
    <div className="diagram-selector bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">选择图表类型</h2>
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {diagramTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`flex-1 py-2 px-4 ${
                selectedType === type.value 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="diagram-options grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredOptions.map(option => (
          <div
            key={option.id}
            className="diagram-option border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
            onClick={() => onSelect(option)}
          >
            <div className="flex items-center gap-2 mb-2">
              {option.icon}
              <h3 className="font-medium">{option.name}</h3>
            </div>
            <div className="text-xs bg-gray-50 p-2 rounded border text-gray-500 max-h-20 overflow-hidden">
              <pre>{option.template.split('\n').slice(0, 3).join('\n') + (option.template.split('\n').length > 3 ? '...' : '')}</pre>
            </div>
          </div>
        ))}
      </div>
      
      {onCancel && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
} 