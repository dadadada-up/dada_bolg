/**
 * 博客文档管理系统
 * 基于GitHub API实现文档查看、管理和删除
 */

// 配置
const config = {
    // 本地文件配置
    docsPath: 'docs/posts', // 文档路径
    
    // 分页配置
    itemsPerPage: 10,
    
    // 本地存储键
    storage: {
        token: 'github_token',
        username: 'github_username',
    }
};

// 应用状态
const state = {
    documents: [],
    filteredDocuments: [],
    categories: [],
    currentPage: 1,
    totalPages: 1,
    isLoading: true,
    selectedDocs: new Set(),
    searchQuery: '',
    categoryFilter: '',
    sortBy: 'date-desc',
    isLoggedIn: false,
    username: '',
    token: '',
};

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    initializeUI();
    loadUserData();
    await fetchCategories();
    await fetchDocuments();
    renderDocuments();
    updateStats();
    setupEventListeners();
});

// 初始化UI元素
function initializeUI() {
    // 切换视图
    document.getElementById('table-view-btn').addEventListener('click', () => {
        document.getElementById('table-view').style.display = 'block';
        document.getElementById('card-view').style.display = 'none';
        document.getElementById('table-view-btn').classList.add('active');
        document.getElementById('card-view-btn').classList.remove('active');
    });
    
    document.getElementById('card-view-btn').addEventListener('click', () => {
        document.getElementById('table-view').style.display = 'none';
        document.getElementById('card-view').style.display = 'grid';
        document.getElementById('table-view-btn').classList.remove('active');
        document.getElementById('card-view-btn').classList.add('active');
    });
    
    // 全选按钮
    document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll('.doc-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const docPath = checkbox.getAttribute('data-path');
            
            if (isChecked) {
                state.selectedDocs.add(docPath);
            } else {
                state.selectedDocs.delete(docPath);
            }
        });
        
        updateBatchActions();
    });
    
    // 全选按钮（另一个）
    document.getElementById('select-all-btn').addEventListener('click', () => {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        selectAllCheckbox.checked = !selectAllCheckbox.checked;
        selectAllCheckbox.dispatchEvent(new Event('change'));
    });
    
    // 批量删除按钮
    document.getElementById('batch-delete-btn').addEventListener('click', () => {
        if (state.selectedDocs.size > 0) {
            showDeleteDialog(Array.from(state.selectedDocs));
        }
    });
    
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', () => {
        state.searchQuery = document.getElementById('search-input').value.trim();
        filterAndSortDocuments();
        renderDocuments();
    });
    
    // 搜索输入框回车
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('search-btn').click();
        }
    });
    
    // 分类筛选
    document.getElementById('category-filter').addEventListener('change', (e) => {
        state.categoryFilter = e.target.value;
        filterAndSortDocuments();
        renderDocuments();
    });
    
    // 排序
    document.getElementById('sort-by').addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        filterAndSortDocuments();
        renderDocuments();
    });
    
    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderDocuments();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            renderDocuments();
        }
    });
    
    // 删除对话框按钮
    document.getElementById('delete-cancel').addEventListener('click', () => {
        hideDeleteDialog();
    });
    
    document.getElementById('delete-confirm').addEventListener('click', () => {
        const filesToDelete = Array.from(document.querySelectorAll('#delete-file-list li')).map(li => li.getAttribute('data-path'));
        deleteSelectedFiles(filesToDelete);
    });
    
    // 详情对话框
    document.getElementById('detail-close').addEventListener('click', () => {
        hideDetailDialog();
    });
    
    // 登录/登出按钮
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// 加载用户数据
function loadUserData() {
    const token = localStorage.getItem(config.storage.token);
    const username = localStorage.getItem(config.storage.username);
    
    if (token && username) {
        state.token = token;
        state.username = username;
        state.isLoggedIn = true;
        updateUserInfo();
    }
}

// 获取分类列表
async function fetchCategories() {
    try {
        const response = await fetch('/docs/posts');
        const data = await response.json();
        
        // 处理分类
        const categories = data
            .filter(item => item.type === 'dir')
            .map(item => item.name);
        
        state.categories = categories;
        
        // 更新分类过滤器
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.innerHTML = '<option value="">所有分类</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('获取分类失败:', error);
    }
}

// 递归获取所有文档
async function fetchDocuments() {
    state.isLoading = true;
    state.documents = [];
    
    try {
        await fetchDirectoryContents(config.docsPath);
        
        // 处理文档
        state.documents = state.documents.filter(doc => doc.name.endsWith('.md'));
        
        // 为每个文档解析元数据
        for (const doc of state.documents) {
            await parseDocumentMetadata(doc);
        }
        
        filterAndSortDocuments();
        state.isLoading = false;
    } catch (error) {
        console.error('获取文档失败:', error);
        state.isLoading = false;
    }
}

// 递归获取目录内容
async function fetchDirectoryContents(path) {
    try {
        const response = await fetch(`/${path}`);
        const data = await response.json();
        
        for (const item of data) {
            if (item.type === 'dir') {
                await fetchDirectoryContents(`${path}/${item.name}`);
            } else if (item.type === 'file' && item.name.endsWith('.md')) {
                state.documents.push(item);
            }
        }
    } catch (error) {
        console.error(`获取目录内容失败: ${path}`, error);
    }
}

// 解析文档元数据
async function parseDocumentMetadata(doc) {
    try {
        const response = await fetch(doc.download_url);
        
        if (!response.ok) {
            throw new Error(`获取文档内容失败: ${response.statusText}`);
        }
        
        const text = await response.text();
        doc.content = text;
        
        // 解析前言元数据
        const frontMatterMatch = text.match(/---\s*([\s\S]*?)\s*---/);
        
        if (frontMatterMatch && frontMatterMatch[1]) {
            const frontMatter = frontMatterMatch[1];
            
            // 提取标题
            const titleMatch = frontMatter.match(/title:\s*["']?(.*?)["']?\s*(\n|$)/);
            if (titleMatch && titleMatch[1]) {
                doc.title = titleMatch[1].trim();
            }
            
            // 提取日期
            const dateMatch = frontMatter.match(/date:\s*["']?(.*?)["']?\s*(\n|$)/);
            if (dateMatch && dateMatch[1]) {
                doc.date = dateMatch[1].trim();
            }
            
            // 提取标签
            const tagsMatch = frontMatter.match(/tags:\s*(\[.*?\]|\n[\s\S]*?(?=\n\w))/);
            if (tagsMatch && tagsMatch[1]) {
                const tagsText = tagsMatch[1];
                
                if (tagsText.startsWith('[')) {
                    // 数组格式 tags: ["tag1", "tag2"]
                    try {
                        doc.tags = JSON.parse(tagsText.replace(/'/g, '"'));
                    } catch (e) {
                        doc.tags = tagsText.replace(/[\[\]'"]/g, '').split(',').map(tag => tag.trim());
                    }
                } else {
                    // YAML格式 tags:\n  - tag1\n  - tag2
                    doc.tags = tagsText.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('-'))
                        .map(line => line.replace(/^-\s*["']?(.*?)["']?$/, '$1').trim());
                }
            }
            
            // 提取描述
            const descMatch = frontMatter.match(/description:\s*["']?(.*?)["']?\s*(\n|$)/);
            if (descMatch && descMatch[1]) {
                doc.description = descMatch[1].trim();
            }
        }
    } catch (error) {
        console.error(`解析文档 ${doc.path} 元数据失败:`, error);
    }
}

// 过滤和排序文档
function filterAndSortDocuments() {
    let filtered = [...state.documents];
    
    // 应用搜索过滤
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(query) || 
            doc.description.toLowerCase().includes(query) ||
            doc.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }
    
    // 应用分类过滤
    if (state.categoryFilter) {
        filtered = filtered.filter(doc => doc.category === state.categoryFilter);
    }
    
    // 应用排序
    switch (state.sortBy) {
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    state.filteredDocuments = filtered;
    state.totalPages = Math.ceil(filtered.length / config.itemsPerPage);
    
    // 重置当前页，如果超出范围
    if (state.currentPage > state.totalPages) {
        state.currentPage = Math.max(1, state.totalPages);
    }
}

// 渲染文档列表
function renderDocuments() {
    const startIndex = (state.currentPage - 1) * config.itemsPerPage;
    const endIndex = startIndex + config.itemsPerPage;
    const docsToShow = state.filteredDocuments.slice(startIndex, endIndex);
    
    renderTableView(docsToShow);
    renderCardView(docsToShow);
    updatePagination();
    updateBatchActions();
}

// 渲染表格视图
function renderTableView(docs) {
    const tableBody = document.getElementById('document-table-body');
    
    if (state.isLoading) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="5" class="loading-message">加载中...</td>
            </tr>
        `;
        return;
    }
    
    if (docs.length === 0) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="5" class="loading-message">未找到匹配的文档</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = docs.map(doc => {
        const checked = state.selectedDocs.has(doc.path) ? 'checked' : '';
        
        return `
            <tr>
                <td><input type="checkbox" class="doc-checkbox" data-path="${doc.path}" ${checked}></td>
                <td>${doc.title}</td>
                <td>${doc.date || '-'}</td>
                <td>${doc.category}${doc.subcategory ? `/${doc.subcategory}` : ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn action-btn" onclick="showDocumentDetails('${doc.path}')">详情</button>
                        <a class="btn action-btn" href="${doc.html_url}" target="_blank">查看</a>
                        <a class="btn action-btn" href="${doc.html_url.replace('blob', 'edit')}" target="_blank">编辑</a>
                        <button class="btn action-btn danger" onclick="showDeleteDialog(['${doc.path}'])">删除</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // 添加复选框事件监听
    const checkboxes = document.querySelectorAll('.doc-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const docPath = this.getAttribute('data-path');
            
            if (this.checked) {
                state.selectedDocs.add(docPath);
            } else {
                state.selectedDocs.delete(docPath);
            }
            
            updateBatchActions();
        });
    });
}

// 渲染卡片视图
function renderCardView(docs) {
    const cardsContainer = document.getElementById('card-view');
    
    if (state.isLoading) {
        cardsContainer.innerHTML = `<div class="loading-card">加载中...</div>`;
        return;
    }
    
    if (docs.length === 0) {
        cardsContainer.innerHTML = `<div class="loading-card">未找到匹配的文档</div>`;
        return;
    }
    
    cardsContainer.innerHTML = docs.map(doc => {
        const checked = state.selectedDocs.has(doc.path) ? 'checked' : '';
        const tags = doc.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');
        
        return `
            <div class="document-card">
                <div class="card-title">${doc.title}</div>
                <div class="card-meta">
                    <div>日期: ${doc.date || '-'}</div>
                    <div>分类: ${doc.category}${doc.subcategory ? `/${doc.subcategory}` : ''}</div>
                    <div>标签: ${tags || '-'}</div>
                </div>
                <div class="card-actions">
                    <div class="card-checkbox">
                        <input type="checkbox" class="doc-checkbox" data-path="${doc.path}" ${checked}>
                        <span>选择</span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn action-btn" onclick="showDocumentDetails('${doc.path}')">详情</button>
                        <button class="btn action-btn danger" onclick="showDeleteDialog(['${doc.path}'])">删除</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 添加复选框事件监听
    const checkboxes = document.querySelectorAll('.doc-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const docPath = this.getAttribute('data-path');
            
            if (this.checked) {
                state.selectedDocs.add(docPath);
            } else {
                state.selectedDocs.delete(docPath);
            }
            
            updateBatchActions();
        });
    });
}

// 更新分页
function updatePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    prevBtn.disabled = state.currentPage <= 1;
    nextBtn.disabled = state.currentPage >= state.totalPages;
    
    pageInfo.textContent = `第 ${state.currentPage} 页 / 共 ${state.totalPages} 页`;
}

// 更新批量操作按钮状态
function updateBatchActions() {
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    
    batchDeleteBtn.disabled = state.selectedDocs.size === 0;
}

// 更新统计信息
function updateStats() {
    document.getElementById('total-docs').textContent = state.documents.length;
    document.getElementById('total-categories').textContent = state.categories.length;
    
    // 计算最近一周新增
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentDocs = state.documents.filter(doc => {
        if (!doc.date) return false;
        const docDate = new Date(doc.date);
        return docDate >= oneWeekAgo;
    });
    
    document.getElementById('recent-docs').textContent = recentDocs.length;
}

// GitHub相关函数
// ===============

// 处理登录
function handleLogin() {
    const tokenInput = prompt('请输入您的GitHub个人访问令牌：');
    
    if (!tokenInput) return;
    
    // 验证令牌
    verifyGitHubToken(tokenInput);
}

// 验证GitHub令牌
async function verifyGitHubToken(token) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `token ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('令牌验证失败');
        }
        
        const userData = await response.json();
        
        // 保存用户数据
        state.token = token;
        state.username = userData.login;
        state.isLoggedIn = true;
        
        // 保存到本地存储
        localStorage.setItem(config.storage.token, token);
        localStorage.setItem(config.storage.username, userData.login);
        
        // 更新UI
        updateUserInfo();
        
        // 刷新文档列表
        fetchDocuments();
    } catch (error) {
        console.error('验证令牌失败:', error);
        alert('验证令牌失败: ' + error.message);
    }
}

// 处理登出
function handleLogout() {
    // 清除用户数据
    state.token = '';
    state.username = '';
    state.isLoggedIn = false;
    
    // 清除本地存储
    localStorage.removeItem(config.storage.token);
    localStorage.removeItem(config.storage.username);
    
    // 更新UI
    updateUserInfo();
}

// 更新用户信息
function updateUserInfo() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    
    if (state.isLoggedIn) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userInfo.textContent = `当前用户: ${state.username}`;
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userInfo.textContent = '未登录';
    }
}

// 删除文件
async function deleteSelectedFiles(filePaths) {
    if (!state.isLoggedIn) {
        alert('请先登录再执行此操作');
        hideDeleteDialog();
        return;
    }
    
    const deletedFiles = [];
    const failedFiles = [];
    
    // 显示进度信息
    const deleteDialog = document.getElementById('delete-dialog');
    const deleteFileList = document.getElementById('delete-file-list');
    const deleteActions = document.getElementById('delete-actions');
    const deleteProgress = document.createElement('div');
    deleteProgress.className = 'delete-progress';
    deleteProgress.textContent = '处理中...';
    deleteActions.style.display = 'none';
    deleteDialog.appendChild(deleteProgress);
    
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        deleteProgress.textContent = `正在处理 ${i + 1}/${filePaths.length}: ${filePath}`;
        
        try {
            // 首先获取文件的SHA
            const doc = state.documents.find(d => d.path === filePath);
            
            if (!doc || !doc.sha) {
                throw new Error('无法获取文件SHA');
            }
            
            // 删除文件
            const url = config.endpoints.deleteFile
                .replace('{owner}', config.owner)
                .replace('{repo}', config.repo)
                .replace('{path}', filePath);
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `token ${state.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `删除文件: ${filePath}`,
                    sha: doc.sha,
                    branch: config.branch
                })
            });
            
            if (!response.ok) {
                throw new Error(`删除失败: ${response.statusText}`);
            }
            
            deletedFiles.push(filePath);
            state.selectedDocs.delete(filePath);
        } catch (error) {
            console.error(`删除文件 ${filePath} 失败:`, error);
            failedFiles.push({ path: filePath, error: error.message });
        }
    }
    
    // 完成删除操作
    deleteDialog.removeChild(deleteProgress);
    deleteActions.style.display = 'flex';
    
    // 显示结果
    if (failedFiles.length === 0) {
        alert(`成功删除 ${deletedFiles.length} 个文件`);
    } else {
        let message = `成功删除 ${deletedFiles.length} 个文件\n`;
        message += `失败 ${failedFiles.length} 个文件:\n`;
        
        failedFiles.forEach(file => {
            message += `- ${file.path}: ${file.error}\n`;
        });
        
        alert(message);
    }
    
    // 刷新文档列表
    hideDeleteDialog();
    fetchDocuments();
}

// 对话框相关函数
// ==============

// 显示删除确认对话框
function showDeleteDialog(filePaths) {
    const deleteDialog = document.getElementById('delete-dialog');
    const deleteFileList = document.getElementById('delete-file-list');
    const deleteConfirm = document.getElementById('delete-confirm');
    
    // 获取文件名列表
    deleteFileList.innerHTML = '';
    filePaths.forEach(path => {
        const doc = state.documents.find(d => d.path === path);
        const li = document.createElement('li');
        li.setAttribute('data-path', path);
        li.textContent = doc ? doc.title : path;
        deleteFileList.appendChild(li);
    });
    
    // 更新确认按钮文本
    deleteConfirm.textContent = `确认删除 (${filePaths.length})`;
    
    // 显示对话框
    deleteDialog.style.display = 'block';
    document.body.classList.add('dialog-open');
}

// 隐藏删除对话框
function hideDeleteDialog() {
    const deleteDialog = document.getElementById('delete-dialog');
    deleteDialog.style.display = 'none';
    document.body.classList.remove('dialog-open');
}

// 显示文档详情对话框
function showDocumentDetails(path) {
    const doc = state.documents.find(d => d.path === path);
    
    if (!doc) {
        alert('找不到文档信息');
        return;
    }
    
    const detailDialog = document.getElementById('detail-dialog');
    const detailTitle = document.getElementById('detail-title');
    const detailContent = document.getElementById('detail-content');
    
    // 设置标题
    detailTitle.textContent = doc.title;
    
    // 设置内容
    const tags = doc.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');
    
    detailContent.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">路径:</div>
            <div class="detail-value">${doc.path}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">分类:</div>
            <div class="detail-value">${doc.category}${doc.subcategory ? `/${doc.subcategory}` : ''}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">日期:</div>
            <div class="detail-value">${doc.date || '-'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">标签:</div>
            <div class="detail-value">${tags || '-'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">描述:</div>
            <div class="detail-value">${doc.description || '-'}</div>
        </div>
        <div class="detail-item detail-content-preview">
            <div class="detail-label">内容预览:</div>
            <div class="detail-value">
                <pre>${doc.content ? doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : '') : '-'}</pre>
            </div>
        </div>
        <div class="detail-actions">
            <a class="btn" href="${doc.html_url}" target="_blank">在GitHub中查看</a>
            <a class="btn" href="${doc.html_url.replace('blob', 'edit')}" target="_blank">编辑文档</a>
        </div>
    `;
    
    // 显示对话框
    detailDialog.style.display = 'block';
    document.body.classList.add('dialog-open');
}

// 隐藏详情对话框
function hideDetailDialog() {
    const detailDialog = document.getElementById('detail-dialog');
    detailDialog.style.display = 'none';
    document.body.classList.remove('dialog-open');
}

// 辅助函数
// ========

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    
    return function() {
        const context = this;
        const args = arguments;
        
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 注册全局函数
window.showDocumentDetails = showDocumentDetails;
window.showDeleteDialog = showDeleteDialog; 