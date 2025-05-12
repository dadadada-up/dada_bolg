'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { Post, Category } from '@/types/post';
import { formatDate } from '@/lib/utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ContentSection, ContentSectionAction } from '@/components/admin/ContentSection';
import { getDisplayCategoryName } from '@/lib/github-client';

// 自定义样式
const tableStyles = {
  table: 'data-table w-full text-base border-collapse shadow-sm',
  header: 'bg-gray-100 text-left',
  headerCell: 'px-4 py-3 font-semibold text-gray-700 border-b-2 border-gray-200',
  sortableHeader: 'px-4 py-3 font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200',
  row: 'hover:bg-gray-50 transition-colors',
  rowEven: 'bg-gray-50',
  cell: 'px-4 py-3 align-middle border-b border-gray-100',
  title: 'font-medium line-clamp-1 text-gray-800 text-base',
  slug: 'text-xs text-gray-500 line-clamp-1 mt-0.5',
  actions: 'flex justify-start items-center space-x-2',
  tag: 'inline-block px-2 py-0.5 text-sm rounded-full bg-blue-50 text-blue-700 whitespace-nowrap',
  dateCell: 'text-center whitespace-nowrap text-sm text-gray-600',
  actionButton: 'w-10 h-10 flex items-center justify-center rounded font-medium transition-colors',
  editButton: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  viewButton: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  deleteButton: 'bg-red-50 text-red-600 hover:bg-red-100',
  sectionTitle: 'text-xl font-bold text-gray-800 mb-2',
  sortIcon: 'ml-1 inline-block'
};

export default function PostsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState(''); // 临时存储输入的搜索词
  const [sortField, setSortField] = useState<'date' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]); // 选中的文章slug列表
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const router = useRouter();
  
  // 获取文章数据
  const { data, error, isLoading, mutate } = useSWR<{
    data: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(() => {
    let url = `/api/posts-new?page=${currentPage}&limit=${pageSize}&admin=true`;
    
    // 添加搜索参数（仅搜索标题）
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}&searchField=title`;
    }
    
    // 添加分类筛选
    if (categoryFilter && categoryFilter !== 'all') {
      url += `&category=${encodeURIComponent(categoryFilter)}`;
    }
    
    // 添加状态筛选
    if (statusFilter && statusFilter !== 'all') {
      url += `&status=${statusFilter}`;
    }
    
    // 添加排序参数
    if (sortField) {
      url += `&sort=${sortField === 'date' ? 'created_at' : 'updated_at'}&order=${sortOrder}`;
    }
    
    console.log('构建API URL:', url);
    return url;
  }, async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('获取文章失败');
    return response.json();
  }, {
    revalidateOnFocus: false, // 避免频繁刷新
    dedupingInterval: 2000, // 减少短时间内的重复请求
    // 确保这些状态变化时会重新获取数据
    refreshWhenHidden: false,
    revalidateIfStale: true,
    refreshInterval: 0
  });
  
  // 监听筛选条件变化
  useEffect(() => {
    // 避免首次加载时触发
    if (data) {
      console.log('筛选条件变化，重新获取数据');
      mutate();
    }
  }, [currentPage, pageSize, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  // 处理导入语雀文档
  const handleImportYuque = async () => {
    // 创建文件选择元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        // 读取文件内容
        const text = await file.text();
        
        // 使用sessionStorage临时存储内容，避免URL过长的问题
        sessionStorage.setItem("yuqueImportContent", text);
        sessionStorage.setItem("yuqueImportFilename", file.name);
        
        // 跳转到导入页面，带上文件内容和文件名
        router.push(`/admin/import-yuque`);
      } catch (error) {
        console.error('读取文件失败:', error);
        alert('读取文件失败，请重试');
      }
    };
    
    // 触发文件选择对话框
    input.click();
  };

  const posts = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  
  // 获取所有分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories-new');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // 筛选和搜索
  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];
    // 所有筛选已在API请求中处理，这里直接返回结果
    return posts;
  }, [posts]);
  
  // 排序处理
  const sortedPosts = useMemo(() => {
    return filteredPosts;
  }, [filteredPosts]);
  
  // 处理排序点击
  const handleSort = (field: 'date' | 'updated') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    // 不需要手动触发mutate，由useEffect处理
  };
  
  // 处理搜索按钮点击
  const handleSearchClick = () => {
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1); // 重置为第一页
    // 直接执行搜索，不清空其他筛选条件
    console.log(`执行标题搜索：关键词=${tempSearchQuery}，保持当前分类=${categoryFilter}，保持当前状态=${statusFilter}`);
    setTimeout(() => mutate(), 0);
  };

  // 处理回车键搜索
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };
  
  // 处理状态筛选变更
  const handleStatusChange = (newStatus: 'all' | 'published' | 'draft') => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // 重置为第一页
    // 保留当前搜索条件和分类筛选
    console.log(`切换状态筛选：${newStatus}，保持当前搜索=${searchQuery}，保持当前分类=${categoryFilter}`);
    setTimeout(() => mutate(), 0); // 触发数据重新获取
  };
  
  // 处理分类筛选变更
  const handleCategoryChange = (newCategory: string) => {
    setCategoryFilter(newCategory);
    setCurrentPage(1); // 重置为第一页
    // 保留当前搜索条件和状态筛选
    console.log(`切换分类：${newCategory}，保持当前搜索=${searchQuery}，保持当前状态=${statusFilter}`);
    setTimeout(() => mutate(), 0); // 触发数据重新获取
  };
  
  // 重置所有筛选条件
  const handleResetFilters = () => {
    setSearchQuery('');
    setTempSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    console.log('重置所有筛选条件');
    setTimeout(() => mutate(), 0);
  };
  
  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 处理选择文章
  const handleSelectPost = (slug: string) => {
    setSelectedPosts(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };
  
  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedPosts.length === sortedPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(sortedPosts.map(post => post.slug));
    }
  };
  
  // 刷新数据
  const refresh = () => {
    mutate();
  };
  
  // 处理删除
  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可逆。')) return;
    
    try {
      const response = await fetch(`/api/posts-new/${slug}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        refresh();
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败，请重试');
    }
  };
  
  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedPosts.length === 0) return;
    
    if (!confirm(`确定要删除这 ${selectedPosts.length} 篇文章吗？此操作不可逆。`)) return;
    
    try {
      const promises = selectedPosts.map(slug => 
        fetch(`/api/posts-new/${slug}`, { method: 'DELETE' })
      );
      
      await Promise.all(promises);
      refresh();
      setSelectedPosts([]);
    } catch (error) {
      console.error('批量删除文章失败:', error);
      alert('批量删除失败，请重试');
    }
  };
  
  // 添加新的批量发布函数
  const handleBatchPublish = async () => {
    if (selectedPosts.length === 0) return;
    
    if (!confirm(`确定要将这 ${selectedPosts.length} 篇文章设为已发布状态吗？`)) return;
    
    try {
      // 获取选中的文章，修改其发布状态，然后保存
      const selectedPostsData = posts.filter(post => selectedPosts.includes(post.slug));
      const updatePromises = selectedPostsData.map(post => 
        fetch(`/api/posts-new/${post.slug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...post,
            published: true
          })
        })
      );
      
      await Promise.all(updatePromises);
      refresh(); // 刷新文章列表
      alert(`已成功将 ${selectedPosts.length} 篇文章设为已发布状态`);
      setSelectedPosts([]); // 清空选择
    } catch (error) {
      console.error('批量发布文章失败:', error);
      alert('批量发布失败，请重试');
    }
  };
  
  // 获取状态标签样式
  const getStatusClass = (published: boolean) => {
    return published 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };
  
  // 修改日期格式化函数，使其显示年月日时分
  const formatCompactDate = (dateString: string | undefined): string => {
    if (!dateString) return '未知日期';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '日期无效';
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() 返回 0-11
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // 使用年/月/日 时:分格式，确保月、日、时、分都是两位数
      return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '日期错误';
    }
  };
  
  // 生成分页项
  const renderPagination = () => {
    const pages = [];
    const maxPageItems = 7;
    
    // 起始页和结束页
    let startPage = Math.max(1, currentPage - Math.floor(maxPageItems / 2));
    let endPage = Math.min(totalPages, startPage + maxPageItems - 1);
    
    // 调整起始页
    if (endPage - startPage + 1 < maxPageItems) {
      startPage = Math.max(1, endPage - maxPageItems + 1);
    }
    
    // 第一页
    if (startPage > 1) {
      pages.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // 页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            i === currentPage 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // 最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  // 渲染排序图标
  const renderSortIcon = (field: 'date' | 'updated') => {
    if (sortField !== field) {
      return null;
    }
    return (
      <span className={tableStyles.sortIcon}>
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  return (
    <div>
      <AdminHeader 
        title="文章管理" 
        subtitle="管理、编辑和发布博客文章"
      />
      
      <ContentSection 
        title="文章列表" 
        actions={
          <div className="flex gap-2">
            <Link href="/admin/new">
              <ContentSectionAction variant="primary">
                + 新建文章
              </ContentSectionAction>
            </Link>
            <ContentSectionAction onClick={handleImportYuque}>
              导入语雀文章
            </ContentSectionAction>
            <button
              onClick={refresh}
              className="secondary-button"
            >
              刷新
            </button>
          </div>
        }
      >
        {/* 搜索和过滤 */}
        <div className="flex flex-wrap justify-between mb-4 gap-3 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* 搜索框 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">标题:</span>
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="搜索文章标题"
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="px-3 py-1.5 border border-gray-300 rounded-md min-w-[200px]"
                />
              </div>
            </div>
            
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">状态:</span>
              <select 
                className="px-3 py-1.5 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as 'all' | 'published' | 'draft')}
              >
                <option value="all">所有状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>
            
            {/* 分类筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">分类:</span>
              <select 
                className="px-3 py-1.5 border border-gray-300 rounded-md"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="all">所有分类</option>
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name} ({category.postCount})
                  </option>
                ))}
              </select>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2 ml-auto">
              <button 
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleSearchClick}
              >
                搜索
              </button>
              
              <button 
                className="px-4 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                onClick={handleResetFilters}
              >
                重置筛选
              </button>
            </div>
          </div>
          
          {/* 显示当前生效的筛选条件和结果数量 */}
          <div className="w-full mt-3 flex flex-wrap gap-2 items-center">
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <>
                <span className="text-sm text-gray-600">当前筛选条件:</span>
                {searchQuery && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center">
                    <span className="font-medium">标题:</span> <span className="ml-1">{searchQuery}</span>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                    <span className="font-medium">状态:</span> <span className="ml-1">{statusFilter === 'published' ? '已发布' : '草稿'}</span>
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full flex items-center">
                    <span className="font-medium">分类:</span> <span className="ml-1">{categories.find(c => c.slug === categoryFilter)?.name || categoryFilter}</span>
                  </span>
                )}
              </>
            )}
            
            <span className={`${(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') ? 'ml-auto' : ''} px-3 py-1.5 text-sm bg-blue-50 text-gray-800 rounded-md font-medium flex items-center border border-blue-200`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') ? (
                <>筛选出 <span className="mx-1 font-bold text-blue-700">{totalItems}</span> 篇文章</>
              ) : (
                <>共 <span className="mx-1 font-bold text-blue-700">{totalItems}</span> 篇文章</>
              )}
            </span>
          </div>
        </div>
        
        {/* 批量操作 */}
        {selectedPosts.length > 0 && (
          <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 rounded-md">
            <span className="text-sm font-medium">已选择 {selectedPosts.length} 篇文章</span>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleBatchDelete}
              >
                删除
              </button>
              <button 
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={handleBatchPublish}
              >
                发布所选
              </button>
              <button 
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                onClick={() => setSelectedPosts([])}
              >
                取消选择
              </button>
            </div>
          </div>
        )}
        
        {/* 文章表格 */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex p-3 border-b">
                <div className="h-5 bg-gray-200 rounded w-4 mr-4"></div>
                <div className="w-full">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className={tableStyles.table}>
              <thead className={tableStyles.header}>
                <tr>
                  <th className={tableStyles.headerCell + ' w-10 text-center'}>
                    <input 
                      type="checkbox" 
                      checked={selectedPosts.length === sortedPosts.length && sortedPosts.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className={tableStyles.headerCell + ' w-96'}>标题</th>
                  <th className={tableStyles.headerCell + ' w-24 text-center'}>状态</th>
                  <th className={tableStyles.headerCell + ' w-44'}>分类</th>
                  <th 
                    className={tableStyles.sortableHeader + ' w-40 text-center'} 
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center justify-center">
                      发布时间
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    className={tableStyles.sortableHeader + ' w-40 text-center'} 
                    onClick={() => handleSort('updated')}
                  >
                    <div className="flex items-center justify-center">
                      更新时间
                      {renderSortIcon('updated')}
                    </div>
                  </th>
                  <th className={tableStyles.headerCell + ' w-44 text-center'}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map((post, index) => (
                  <tr key={post.slug} className={`${tableStyles.row} ${index % 2 === 1 ? tableStyles.rowEven : ''}`}>
                    <td className={tableStyles.cell + ' text-center'}>
                      <input 
                        type="checkbox" 
                        checked={selectedPosts.includes(post.slug)}
                        onChange={() => handleSelectPost(post.slug)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className={tableStyles.cell + ' max-w-xs'}>
                      <div className={tableStyles.title}>{post.title}</div>
                      <div className={tableStyles.slug}>{post.slug}</div>
                    </td>
                    <td className={tableStyles.cell + ' text-center'}>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(post.published || false)}`}>
                        {post.published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className={tableStyles.cell}>
                      <div className="flex flex-wrap gap-1">
                        {post.categories.slice(0, 2).map(cat => (
                          <span key={cat} className={tableStyles.tag}>
                            {getDisplayCategoryName(cat)}
                          </span>
                        ))}
                        {post.categories.length > 2 && (
                          <span className="text-xs text-gray-500">+{post.categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.cell + ' ' + tableStyles.dateCell}>
                      {formatCompactDate(post.date)}
                    </td>
                    <td className={tableStyles.cell + ' ' + tableStyles.dateCell}>
                      {post.updated ? formatCompactDate(post.updated) : formatCompactDate(post.date)}
                    </td>
                    <td className={tableStyles.cell}>
                      <div className={tableStyles.actions}>
                        <Link href={`/admin/edit-post/${post.slug}`}>
                          <button className={`${tableStyles.actionButton} ${tableStyles.editButton}`} title="编辑文章">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </Link>
                        <Link href={`/posts/${post.slug}`} target="_blank">
                          <button className={`${tableStyles.actionButton} ${tableStyles.viewButton}`} title="查看文章">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </Link>
                        <button 
                          className={`${tableStyles.actionButton} ${tableStyles.deleteButton}`}
                          onClick={() => handleDelete(post.slug)}
                          title="删除文章"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {sortedPosts.length === 0 && (
                  <tr>
                    <td colSpan={7} className={`${tableStyles.cell} text-center py-8 text-gray-500`}>
                      {searchQuery ? '没有找到匹配的文章' : '没有文章'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-1">
              {renderPagination()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">每页显示:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        )}
      </ContentSection>
    </div>
  );
} 