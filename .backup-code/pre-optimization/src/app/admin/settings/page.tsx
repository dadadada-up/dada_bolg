'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState({
    title: '我的博客',
    description: '个人博客，分享技术文章和生活随笔',
    author: '博主',
    email: 'example@example.com',
    github: 'https://github.com/yourusername',
    twitter: 'https://twitter.com/yourusername',
    githubRepo: 'dada_blog',
    githubOwner: 'dadadada-up',
    siteUrl: 'http://localhost:3001',
    githubToken: '',
  });
  
  const [userSettings, setUserSettings] = useState({
    username: 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const router = useRouter();

  // 在组件加载时从环境变量中加载设置
  useEffect(() => {
    // 在客户端环境中，我们可以访问window对象
    if (typeof window !== 'undefined') {
      // 获取当前域名
      const host = window.location.origin;
      
      // 模拟从环境变量或API获取初始设置
      // 在实际应用中，你应该从API获取这些值
      setSiteSettings(prev => ({
        ...prev,
        siteUrl: host,
        // 其他值可能会从API中获取
      }));
    }
  }, []);

  // 处理站点设置表单提交
  const handleSiteSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该有实际的API调用来保存设置
      // const response = await fetch('/api/settings/site', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(siteSettings),
      // });
      
      // if (!response.ok) throw new Error('保存设置失败');
      
      setSuccess('站点设置已成功保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理用户设置表单提交
  const handleUserSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userSettings.newPassword !== userSettings.confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该有实际的API调用来保存用户设置
      // const response = await fetch('/api/settings/user', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     username: userSettings.username,
      //     currentPassword: userSettings.currentPassword,
      //     newPassword: userSettings.newPassword,
      //   }),
      // });
      
      // if (!response.ok) throw new Error('更新用户设置失败');
      
      setSuccess('用户设置已成功更新');
      
      // 清空密码字段
      setUserSettings({
        ...userSettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新站点设置
  const updateSiteSetting = (key: string, value: string) => {
    setSiteSettings({
      ...siteSettings,
      [key]: value,
    });
  };

  // 更新用户设置
  const updateUserSetting = (key: string, value: string) => {
    setUserSettings({
      ...userSettings,
      [key]: value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">系统设置</h1>
          <p className="text-gray-500 mt-1">配置博客系统参数和个人信息</p>
        </div>
      </div>

      {/* 主内容区 */}
      {/* 消息提示 */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>{success}</p>
        </div>
      )}
    
      {/* 站点设置表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">站点设置</h2>
        </div>
        
        <form onSubmit={handleSiteSettingsSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">博客标题</label>
              <input
                type="text"
                value={siteSettings.title}
                onChange={(e) => updateSiteSetting('title', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">博客作者</label>
              <input
                type="text"
                value={siteSettings.author}
                onChange={(e) => updateSiteSetting('author', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">博客描述</label>
              <textarea
                value={siteSettings.description}
                onChange={(e) => updateSiteSetting('description', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">邮箱地址</label>
              <input
                type="email"
                value={siteSettings.email}
                onChange={(e) => updateSiteSetting('email', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">GitHub 地址</label>
              <input
                type="url"
                value={siteSettings.github}
                onChange={(e) => updateSiteSetting('github', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Twitter 地址</label>
              <input
                type="url"
                value={siteSettings.twitter}
                onChange={(e) => updateSiteSetting('twitter', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <hr className="my-4" />
            <h3 className="text-md font-medium mb-4">GitHub 存储设置</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">GitHub Token</label>
            <input
              type="password"
              value={siteSettings.githubToken}
              onChange={(e) => updateSiteSetting('githubToken', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="github_pat_xxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">用于访问GitHub API的个人访问令牌，请确保有足够的权限</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">GitHub 仓库</label>
            <input
              type="text"
              value={siteSettings.githubRepo}
              onChange={(e) => updateSiteSetting('githubRepo', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">存储博客内容的GitHub仓库名</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">GitHub 用户名</label>
            <input
              type="text"
              value={siteSettings.githubOwner}
              onChange={(e) => updateSiteSetting('githubOwner', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">拥有该仓库的GitHub用户名或组织名</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">站点URL</label>
            <input
              type="url"
              value={siteSettings.siteUrl}
              onChange={(e) => updateSiteSetting('siteUrl', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">博客网站的URL，例如http://localhost:3001</p>
          </div>
          
          <div className="md:col-span-2">
            <hr className="my-4" />
            <h3 className="text-md font-medium mb-4">社交媒体设置</h3>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-white ${
                loading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? '保存中...' : '保存站点设置'}
            </button>
          </div>
        </form>
      </div>
      
      {/* 用户设置表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">用户设置</h2>
        </div>
        
        <form onSubmit={handleUserSettingsSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <input
                type="text"
                value={userSettings.username}
                onChange={(e) => updateUserSetting('username', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">当前密码</label>
              <input
                type="password"
                value={userSettings.currentPassword}
                onChange={(e) => updateUserSetting('currentPassword', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">新密码</label>
              <input
                type="password"
                value={userSettings.newPassword}
                onChange={(e) => updateUserSetting('newPassword', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">确认新密码</label>
              <input
                type="password"
                value={userSettings.confirmPassword}
                onChange={(e) => updateUserSetting('confirmPassword', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-white ${
                loading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? '更新中...' : '更新用户设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 