'use client';

import { useState, useEffect } from 'react';

// 定义响应类型
interface TestResponse {
  status: string;
  message: string;
  database?: string;
  timestamp?: string;
  error?: string;
  result?: any;
}

export default function TestTursoPage() {
  // 状态管理
  const [result, setResult] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 运行测试
  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      // 创建一个简单的请求，服务器端会尝试连接Turso
      const res = await fetch('/api/test-turso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      if (!res.ok) {
        throw new Error(`HTTP错误 ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试过程中发生未知错误');
      console.error('测试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时自动执行测试
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Turso 数据库连接测试</h1>
      
      {loading ? (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="text-blue-700">正在测试连接，请稍候...</p>
        </div>
      ) : null}
      
      {error ? (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <h2 className="text-red-700 font-semibold mb-2">测试失败</h2>
          <p className="text-red-600">{error}</p>
        </div>
      ) : null}
      
      {result ? (
        <div className={`p-4 rounded-md mb-4 ${result.status === 'success' ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <h2 className={`font-semibold mb-2 ${result.status === 'success' ? 'text-green-700' : 'text-yellow-700'}`}>
            测试结果
          </h2>
          <p className={result.status === 'success' ? 'text-green-600' : 'text-yellow-600'}>
            {result.message}
          </p>
          
          {result.database && (
            <p className="mt-2">
              <span className="font-medium">数据库类型:</span> {result.database}
            </p>
          )}
          
          {result.timestamp && (
            <p>
              <span className="font-medium">时间戳:</span> {result.timestamp}
            </p>
          )}
          
          {result.error && (
            <div className="mt-4 p-3 bg-red-100 rounded-md">
              <p className="text-red-700">{result.error}</p>
            </div>
          )}
        </div>
      ) : null}
      
      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? '测试中...' : '重新测试'}
      </button>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h2 className="font-semibold mb-2">帮助信息</h2>
        <p className="mb-2">
          此页面测试应用程序是否能够成功连接到Turso数据库。测试会尝试执行一个简单的SQL查询，
          并验证是否能获得正确的响应。
        </p>
        <p className="mb-2">
          如果测试失败，请检查以下几点：
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Turso数据库是否已正确创建</li>
          <li>环境变量(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)是否正确设置</li>
          <li>网络连接是否正常</li>
          <li>Turso服务是否可用</li>
        </ul>
      </div>
    </div>
  );
} 