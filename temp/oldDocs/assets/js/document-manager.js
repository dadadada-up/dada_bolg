/**
 * 博客文档管理系统
 * 基于GitHub API实现文档查看、管理和删除
 */

// 应用状态
const state = {
    token: null,
    user: null,
    documents: [],
    filteredDocuments: [],
    categories: [],
    currentPage: 1,
    isLoading: false,
    sortBy: 'title',
    sortOrder: 'asc'
};

// 应用配置
const config = {
    owner: 'dadadada-up',
    repo: 'dada_blog',
    branch: 'main',
    docsPath: 'content/posts',
    itemsPerPage: 10,
    endpoints: {
        contents: 'https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}',
        searchCode: 'https://api.github.com/search/code?q=repo:{owner}/{repo}+path:{path}',
        deleteFile: 'https://api.github.com/repos/{owner}/{repo}/contents/{path}'
    }
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
    
    document.getElementById('sort-order').addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
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
        const url = config.endpoints.contents
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', config.docsPath)
            .replace('{branch}', config.branch);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取分类列表失败: ${response.statusText}`);
        }
        
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
        updateStats();
        state.isLoading = false;
    } catch (error) {
        console.error('获取文档失败:', error);
        state.isLoading = false;
    }
}

// 递归获取目录内容
async function fetchDirectoryContents(path) {
    try {
        const url = config.endpoints.contents
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', path)
            .replace('{branch}', config.branch);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取目录 ${path} 失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        for (const item of data) {
            if (item.type === 'dir') {
                await fetchDirectoryContents(item.path);
            } else if (item.type === 'file' && item.name.endsWith('.md')) {
                state.documents.push({
                    name: item.name,
                    path: item.path,
                    sha: item.sha,
                    download_url: item.download_url,
                    html_url: item.html_url,
                    category: path.replace(config.docsPath + '/', '').split('/')[0] || '根目录',
                    subcategory: path.replace(config.docsPath + '/', '').split('/')[1] || '',
                    title: item.name.replace('.md', ''),
                    date: '',
                    tags: [],
                    description: '',
                    content: null
                });
            }
        }
    } catch (error) {
        console.error(`获取目录 ${path} 失败:`, error);
    }
}

// 解析文档元数据
async function parseDocumentMetadata(doc) {
    try {
        const response = await fetch(doc.download_url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3.raw'
            }
        });
        
        if (!response.ok) {
            throw new Error(`获取文档内容失败: ${response.statusText}`);
        }
        
        const content = await response.text();
        doc.content = content;
        
        // 解析 YAML front matter
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            const metadata = {};
            
            frontMatter.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join(':').trim();
                    metadata[key.trim()] = value;
                }
            });
            
            doc.title = metadata.title || doc.title;
            doc.date = metadata.date || '';
            doc.tags = metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : [];
            doc.description = metadata.description || '';
        }
    } catch (error) {
        console.error(`解析文档元数据失败: ${doc.path}`, error);
    }
}

// 过滤和排序文档
function filterAndSortDocuments() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;
    
    // 过滤文档
    let filtered = state.documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchText) ||
                            doc.description.toLowerCase().includes(searchText) ||
                            doc.tags.some(tag => tag.toLowerCase().includes(searchText));
        
        const matchesCategory = !category || doc.category === category;
        
        return matchesSearch && matchesCategory;
    });
    
    // 排序文档
    filtered = sortDocuments(filtered, sortBy, sortOrder);
    
    state.filteredDocuments = filtered;
    renderDocumentList();
    updatePagination();
}

// 排序文档
function sortDocuments(docs, sortBy, sortOrder) {
    return [...docs].sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'date':
                comparison = new Date(b.date) - new Date(a.date);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                if (comparison === 0) {
                    comparison = a.subcategory.localeCompare(b.subcategory);
                }
                break;
            default:
                comparison = 0;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
}

// 分页文档
function paginateDocuments(docs, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return docs.slice(start, end);
}

// 更新分页
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(state.filteredDocuments.length / config.itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    let html = '';
    
    // 上一页按钮
    html += `
        <button class="btn" onclick="changePage(${state.currentPage - 1})" 
                ${state.currentPage === 1 ? 'disabled' : ''}>
            上一页
        </button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= state.currentPage - 2 && i <= state.currentPage + 2)
        ) {
            html += `
                <button class="btn ${i === state.currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (
            i === state.currentPage - 3 ||
            i === state.currentPage + 3
        ) {
            html += '<span class="ellipsis">...</span>';
        }
    }
    
    // 下一页按钮
    html += `
        <button class="btn" onclick="changePage(${state.currentPage + 1})" 
                ${state.currentPage === totalPages ? 'disabled' : ''}>
            下一页
        </button>
    `;
    
    pagination.innerHTML = html;
}

// 切换页码
function changePage(page) {
    const totalPages = Math.ceil(state.filteredDocuments.length / config.itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    state.currentPage = page;
    renderDocumentList();
    updatePagination();
}

// 渲染文档列表
function renderDocumentList() {
    const container = document.getElementById('document-list');
    const viewMode = document.querySelector('input[name="view-mode"]:checked').value;
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    if (state.filteredDocuments.length === 0) {
        container.innerHTML = '<div class="empty">没有找到文档</div>';
        return;
    }
    
    // 分页
    const paginatedDocs = paginateDocuments(
        state.filteredDocuments,
        state.currentPage,
        config.itemsPerPage
    );
    
    if (viewMode === 'table') {
        renderTableView(container, paginatedDocs);
    } else {
        renderCardView(container, paginatedDocs);
    }
}

// 渲染表格视图
function renderTableView(container, docs) {
    container.innerHTML = docs.map(doc => {
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
function renderCardView(container, docs) {
    container.innerHTML = docs.map(doc => {
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

// 更新批量操作按钮状态
function updateBatchActions() {
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    
    batchDeleteBtn.disabled = state.selectedDocs.size === 0;
}

// 更新统计信息
function updateStats() {
    const totalDocs = state.documents.length;
    const totalCategories = state.categories.length;
    const totalTags = new Set(state.documents.flatMap(doc => doc.tags)).size;
    
    document.getElementById('total-docs').textContent = totalDocs;
    document.getElementById('total-categories').textContent = totalCategories;
    document.getElementById('total-tags').textContent = totalTags;
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
    state.token = null;
    state.username = null;
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

// 查看文档
async function viewDocument(path) {
    try {
        const doc = state.documents.find(d => d.path === path);
        if (!doc) {
            throw new Error('文档不存在');
        }
        
        if (!doc.content) {
            const response = await fetch(doc.download_url, {
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取文档内容失败: ${response.statusText}`);
            }
            
            doc.content = await response.text();
        }
        
        const dialog = document.getElementById('document-dialog');
        const content = document.getElementById('document-content');
        
        // 使用 marked 库将 Markdown 转换为 HTML
        const html = marked.parse(doc.content);
        content.innerHTML = html;
        
        dialog.style.display = 'block';
    } catch (error) {
        console.error('查看文档失败:', error);
        alert('查看文档失败: ' + error.message);
    }
}

// 确认删除文档
function confirmDelete(path) {
    const dialog = document.getElementById('delete-dialog');
    const confirmBtn = document.getElementById('confirm-delete');
    
    confirmBtn.onclick = () => deleteDocument(path);
    dialog.style.display = 'block';
}

// 删除文档
async function deleteDocument(path) {
    try {
        const doc = state.documents.find(d => d.path === path);
        if (!doc) {
            throw new Error('文档不存在');
        }
        
        const url = config.endpoints.deleteFile
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', path);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete ${path}`,
                sha: doc.sha
            })
        });
        
        if (!response.ok) {
            throw new Error(`删除文档失败: ${response.statusText}`);
        }
        
        // 从列表中移除文档
        state.documents = state.documents.filter(d => d.path !== path);
        filterAndSortDocuments();
        
        // 关闭对话框
        document.getElementById('delete-dialog').style.display = 'none';
        
        alert('文档删除成功');
    } catch (error) {
        console.error('删除文档失败:', error);
        alert('删除文档失败: ' + error.message);
    }
}

// 用户登录
async function login() {
    const token = prompt('请输入 GitHub 个人访问令牌:');
    if (!token) {
        return;
    }
    
    try {
        // 验证令牌
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('无效的令牌');
        }
        
        const user = await response.json();
        
        // 更新状态
        state.token = token;
        state.user = {
            name: user.name || user.login,
            avatar: user.avatar_url,
            login: user.login
        };
        
        // 更新 UI
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('user-avatar').src = user.avatar_url;
        document.getElementById('user-name').textContent = user.name || user.login;
        
        // 获取文档
        await fetchCategories();
        await fetchDocuments();
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败: ' + error.message);
    }
}

// 用户登出
function logout() {
    state.token = null;
    state.user = null;
    state.documents = [];
    state.filteredDocuments = [];
    state.categories = [];
    
    // 更新 UI
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('document-list').innerHTML = '';
    document.getElementById('category-filter').innerHTML = '<option value="">所有分类</option>';
}

// 初始化
async function init() {
    // 添加事件监听器
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('search-input').addEventListener('input', filterAndSortDocuments);
    document.getElementById('category-filter').addEventListener('change', filterAndSortDocuments);
    document.getElementById('sort-by').addEventListener('change', filterAndSortDocuments);
    document.getElementById('sort-order').addEventListener('change', filterAndSortDocuments);
    
    // 添加视图模式切换事件
    document.querySelectorAll('input[name="view-mode"]').forEach(radio => {
        radio.addEventListener('change', renderDocumentList);
    });
    
    // 添加对话框关闭事件
    document.querySelectorAll('.dialog-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.dialog').style.display = 'none';
        });
    });
    
    // 检查是否已登录
    if (state.token) {
        await fetchCategories();
        await fetchDocuments();
    }
}

// 启动应用
init();

// 导出文档
async function exportDocuments() {
    try {
        const docs = state.filteredDocuments;
        if (docs.length === 0) {
            throw new Error('没有可导出的文档');
        }
        
        // 创建导出数据
        const exportData = docs.map(doc => ({
            title: doc.title,
            category: doc.category,
            subcategory: doc.subcategory,
            date: doc.date,
            tags: doc.tags,
            description: doc.description,
            content: doc.content
        }));
        
        // 创建 Blob
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog-documents-${new Date().toISOString().split('T')[0]}.json`;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('导出文档失败:', error);
        alert('导出文档失败: ' + error.message);
    }
}

// 添加导出按钮事件
document.getElementById('export-btn').addEventListener('click', exportDocuments);

// 导入文档
async function importDocuments() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!Array.isArray(data)) {
                    throw new Error('无效的导入文件格式');
                }
                
                // 验证数据格式
                const isValid = data.every(doc => 
                    doc.title && 
                    doc.category && 
                    doc.content
                );
                
                if (!isValid) {
                    throw new Error('导入文件缺少必要字段');
                }
                
                // 创建新文档
                for (const doc of data) {
                    const path = `${config.docsPath}/${doc.category}/${doc.title}.md`;
                    
                    // 创建文件内容
                    const content = `---
title: ${doc.title}
date: ${doc.date || new Date().toISOString()}
category: ${doc.category}
subcategory: ${doc.subcategory || ''}
tags: ${doc.tags ? doc.tags.join(', ') : ''}
description: ${doc.description || ''}
---

${doc.content}
`;
                    
                    // 上传文件
                    const url = config.endpoints.contents
                        .replace('{owner}', config.owner)
                        .replace('{repo}', config.repo)
                        .replace('{path}', path);
                    
                    const response = await fetch(url, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${state.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Import ${doc.title}`,
                            content: btoa(unescape(encodeURIComponent(content)))
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`导入文档 ${doc.title} 失败: ${response.statusText}`);
                    }
                }
                
                // 刷新文档列表
                await fetchDocuments();
                alert('文档导入成功');
            } catch (error) {
                console.error('导入文档失败:', error);
                alert('导入文档失败: ' + error.message);
            }
        };
        
        input.click();
    } catch (error) {
        console.error('导入文档失败:', error);
        alert('导入文档失败: ' + error.message);
    }
}

// 添加导入按钮事件
document.getElementById('import-btn').addEventListener('click', importDocuments);

// 编辑文档
async function editDocument(path) {
    try {
        const doc = state.documents.find(d => d.path === path);
        if (!doc) {
            throw new Error('文档不存在');
        }
        
        if (!doc.content) {
            const response = await fetch(doc.download_url, {
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取文档内容失败: ${response.statusText}`);
            }
            
            doc.content = await response.text();
        }
        
        // 创建编辑对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h2>编辑文档</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="edit-title">标题</label>
                        <input type="text" id="edit-title" value="${doc.title}">
                    </div>
                    <div class="form-group">
                        <label for="edit-category">分类</label>
                        <select id="edit-category">
                            ${state.categories.map(cat => `
                                <option value="${cat}" ${cat === doc.category ? 'selected' : ''}>
                                    ${cat}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-subcategory">子分类</label>
                        <input type="text" id="edit-subcategory" value="${doc.subcategory}">
                    </div>
                    <div class="form-group">
                        <label for="edit-tags">标签</label>
                        <input type="text" id="edit-tags" value="${doc.tags.join(', ')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-description">描述</label>
                        <textarea id="edit-description">${doc.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-content">内容</label>
                        <textarea id="edit-content">${doc.content}</textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn" onclick="this.closest('.dialog').remove()">取消</button>
                    <button class="btn btn-primary" onclick="saveDocument('${path}')">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加关闭事件
        dialog.querySelector('.dialog-close').onclick = () => dialog.remove();
    } catch (error) {
        console.error('编辑文档失败:', error);
        alert('编辑文档失败: ' + error.message);
    }
}

// 保存文档
async function saveDocument(path) {
    try {
        const dialog = document.querySelector('.dialog');
        const doc = state.documents.find(d => d.path === path);
        
        if (!doc) {
            throw new Error('文档不存在');
        }
        
        // 获取表单数据
        const title = document.getElementById('edit-title').value;
        const category = document.getElementById('edit-category').value;
        const subcategory = document.getElementById('edit-subcategory').value;
        const tags = document.getElementById('edit-tags').value.split(',').map(tag => tag.trim());
        const description = document.getElementById('edit-description').value;
        const content = document.getElementById('edit-content').value;
        
        // 创建新路径
        const newPath = `${config.docsPath}/${category}/${title}.md`;
        
        // 创建文件内容
        const fileContent = `---
title: ${title}
date: ${doc.date || new Date().toISOString()}
category: ${category}
subcategory: ${subcategory}
tags: ${tags.join(', ')}
description: ${description}
---

${content}
`;
        
        // 上传文件
        const url = config.endpoints.contents
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', newPath);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update ${title}`,
                content: btoa(unescape(encodeURIComponent(fileContent))),
                sha: doc.sha
            })
        });
        
        if (!response.ok) {
            throw new Error(`保存文档失败: ${response.statusText}`);
        }
        
        // 如果路径改变，删除旧文件
        if (newPath !== path) {
            const deleteUrl = config.endpoints.deleteFile
                .replace('{owner}', config.owner)
                .replace('{repo}', config.repo)
                .replace('{path}', path);
            
            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete ${path}`,
                    sha: doc.sha
                })
            });
            
            if (!deleteResponse.ok) {
                throw new Error(`删除旧文件失败: ${deleteResponse.statusText}`);
            }
        }
        
        // 刷新文档列表
        await fetchDocuments();
        
        // 关闭对话框
        dialog.remove();
        
        alert('文档保存成功');
    } catch (error) {
        console.error('保存文档失败:', error);
        alert('保存文档失败: ' + error.message);
    }
}

// 添加编辑按钮事件
document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editDocument(btn.dataset.path));
});

// 创建文档
async function createDocument() {
    try {
        // 创建编辑对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h2>创建文档</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="create-title">标题</label>
                        <input type="text" id="create-title" required>
                    </div>
                    <div class="form-group">
                        <label for="create-category">分类</label>
                        <select id="create-category" required>
                            <option value="">选择分类</option>
                            ${state.categories.map(cat => `
                                <option value="${cat}">${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="create-subcategory">子分类</label>
                        <input type="text" id="create-subcategory">
                    </div>
                    <div class="form-group">
                        <label for="create-tags">标签</label>
                        <input type="text" id="create-tags" placeholder="用逗号分隔">
                    </div>
                    <div class="form-group">
                        <label for="create-description">描述</label>
                        <textarea id="create-description"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="create-content">内容</label>
                        <textarea id="create-content" required></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn" onclick="this.closest('.dialog').remove()">取消</button>
                    <button class="btn btn-primary" onclick="saveNewDocument()">创建</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加关闭事件
        dialog.querySelector('.dialog-close').onclick = () => dialog.remove();
    } catch (error) {
        console.error('创建文档失败:', error);
        alert('创建文档失败: ' + error.message);
    }
}

// 保存新文档
async function saveNewDocument() {
    try {
        const dialog = document.querySelector('.dialog');
        
        // 获取表单数据
        const title = document.getElementById('create-title').value;
        const category = document.getElementById('create-category').value;
        const subcategory = document.getElementById('create-subcategory').value;
        const tags = document.getElementById('create-tags').value.split(',').map(tag => tag.trim());
        const description = document.getElementById('create-description').value;
        const content = document.getElementById('create-content').value;
        
        // 验证必填字段
        if (!title || !category || !content) {
            throw new Error('请填写必填字段');
        }
        
        // 创建文件路径
        const path = `${config.docsPath}/${category}/${title}.md`;
        
        // 创建文件内容
        const fileContent = `---
title: ${title}
date: ${new Date().toISOString()}
category: ${category}
subcategory: ${subcategory}
tags: ${tags.join(', ')}
description: ${description}
---

${content}
`;
        
        // 上传文件
        const url = config.endpoints.contents
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', path);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Create ${title}`,
                content: btoa(unescape(encodeURIComponent(fileContent)))
            })
        });
        
        if (!response.ok) {
            throw new Error(`创建文档失败: ${response.statusText}`);
        }
        
        // 刷新文档列表
        await fetchDocuments();
        
        // 关闭对话框
        dialog.remove();
        
        alert('文档创建成功');
    } catch (error) {
        console.error('创建文档失败:', error);
        alert('创建文档失败: ' + error.message);
    }
}

// 添加创建按钮事件
document.getElementById('create-btn').addEventListener('click', createDocument);

// 预览文档
async function previewDocument(path) {
    try {
        const doc = state.documents.find(d => d.path === path);
        if (!doc) {
            throw new Error('文档不存在');
        }
        
        if (!doc.content) {
            const response = await fetch(doc.download_url, {
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取文档内容失败: ${response.statusText}`);
            }
            
            doc.content = await response.text();
        }
        
        // 创建预览对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h2>预览文档</h2>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="preview-header">
                        <h3>${doc.title}</h3>
                        <div class="preview-meta">
                            <span class="category">${doc.category}</span>
                            <span class="subcategory">${doc.subcategory}</span>
                            <span class="date">${doc.date}</span>
                        </div>
                        <div class="preview-tags">
                            ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="preview-description">
                            ${doc.description}
                        </div>
                    </div>
                    <div class="preview-content">
                        ${marked.parse(doc.content)}
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn" onclick="this.closest('.dialog').remove()">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加关闭事件
        dialog.querySelector('.dialog-close').onclick = () => dialog.remove();
    } catch (error) {
        console.error('预览文档失败:', error);
        alert('预览文档失败: ' + error.message);
    }
}

// 添加预览按钮事件
document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', () => previewDocument(btn.dataset.path));
});

// 批量操作
async function batchOperation(action) {
    try {
        const selectedDocs = state.documents.filter(doc => doc.selected);
        if (selectedDocs.length === 0) {
            throw new Error('请选择要操作的文档');
        }
        
        switch (action) {
            case 'delete':
                if (!confirm(`确定要删除选中的 ${selectedDocs.length} 个文档吗？此操作不可撤销。`)) {
                    return;
                }
                
                for (const doc of selectedDocs) {
                    const url = config.endpoints.deleteFile
                        .replace('{owner}', config.owner)
                        .replace('{repo}', config.repo)
                        .replace('{path}', doc.path);
                    
                    const response = await fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `token ${state.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Delete ${doc.title}`,
                            sha: doc.sha
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`删除文档 ${doc.title} 失败: ${response.statusText}`);
                    }
                }
                
                alert('批量删除成功');
                break;
                
            case 'export':
                const exportData = selectedDocs.map(doc => ({
                    title: doc.title,
                    category: doc.category,
                    subcategory: doc.subcategory,
                    date: doc.date,
                    tags: doc.tags,
                    description: doc.description,
                    content: doc.content
                }));
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: 'application/json'
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `blog-documents-${new Date().toISOString().split('T')[0]}.json`;
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                break;
                
            default:
                throw new Error('不支持的操作');
        }
        
        // 刷新文档列表
        await fetchDocuments();
    } catch (error) {
        console.error('批量操作失败:', error);
        alert('批量操作失败: ' + error.message);
    }
}

// 选择/取消选择所有文档
function toggleSelectAll() {
    const selectAll = document.getElementById('select-all').checked;
    state.documents.forEach(doc => doc.selected = selectAll);
    renderDocumentList();
}

// 选择/取消选择单个文档
function toggleSelectDocument(path) {
    const doc = state.documents.find(d => d.path === path);
    if (doc) {
        doc.selected = !doc.selected;
        renderDocumentList();
    }
}

// 更新批量操作按钮状态
function updateBatchButtons() {
    const selectedCount = state.documents.filter(doc => doc.selected).length;
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    const batchExportBtn = document.getElementById('batch-export-btn');
    
    batchDeleteBtn.disabled = selectedCount === 0;
    batchExportBtn.disabled = selectedCount === 0;
}

// 添加批量操作按钮事件
document.getElementById('batch-delete-btn').addEventListener('click', () => batchOperation('delete'));
document.getElementById('batch-export-btn').addEventListener('click', () => batchOperation('export'));
document.getElementById('select-all').addEventListener('change', toggleSelectAll);

// 搜索文档
async function searchDocuments(query) {
    try {
        if (!query) {
            return state.documents;
        }
        
        const url = config.endpoints.searchCode
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', config.docsPath)
            + `+${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`搜索文档失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 获取匹配的文档
        const matchedDocs = [];
        for (const item of data.items) {
            const path = item.path;
            const doc = state.documents.find(d => d.path === path);
            if (doc) {
                matchedDocs.push(doc);
            }
        }
        
        return matchedDocs;
    } catch (error) {
        console.error('搜索文档失败:', error);
        alert('搜索文档失败: ' + error.message);
        return [];
    }
}

// 处理搜索输入
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const query = e.target.value.trim();
        if (query) {
            state.filteredDocuments = await searchDocuments(query);
        } else {
            state.filteredDocuments = [...state.documents];
        }
        renderDocumentList();
    }, 300);
}); 