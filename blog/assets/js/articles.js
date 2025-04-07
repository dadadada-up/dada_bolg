/**
 * 文章列表页面 JavaScript
 * 处理文章的过滤、排序和分页
 */

// 页面状态
const articlesState = {
    filteredPosts: [],
    categoryFilter: '',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    currentPage: 1,
    itemsPerPage: 10
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化事件监听
    initEventListeners();
    
    // 检查URL参数
    checkUrlParams();
    
    // 初始化页面
    initArticlesPage();
});

// 初始化事件监听
function initEventListeners() {
    // 分类过滤器
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', () => {
        articlesState.categoryFilter = categoryFilter.value;
        articlesState.currentPage = 1;
        filterAndRenderPosts();
    });
    
    // 排序选择
    const sortBy = document.getElementById('sort-by');
    sortBy.addEventListener('change', () => {
        articlesState.sortBy = sortBy.value;
        filterAndRenderPosts();
    });
    
    // 排序顺序
    const sortOrder = document.getElementById('sort-order');
    sortOrder.addEventListener('change', () => {
        articlesState.sortOrder = sortOrder.value;
        filterAndRenderPosts();
    });
    
    // 搜索框
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            articlesState.searchQuery = searchInput.value.trim().toLowerCase();
            articlesState.currentPage = 1;
            filterAndRenderPosts();
        }
    });
    
    searchBtn.addEventListener('click', () => {
        articlesState.searchQuery = searchInput.value.trim().toLowerCase();
        articlesState.currentPage = 1;
        filterAndRenderPosts();
    });
}

// 检查URL参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 检查分类参数
    const category = urlParams.get('category');
    if (category) {
        articlesState.categoryFilter = category;
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.value = category;
    }
    
    // 检查标签参数
    const tag = urlParams.get('tag');
    if (tag) {
        articlesState.tagFilter = tag;
    }
    
    // 检查搜索参数
    const query = urlParams.get('query');
    if (query) {
        articlesState.searchQuery = query;
        document.getElementById('search-input').value = query;
    }
    
    // 检查页码参数
    const page = urlParams.get('page');
    if (page && !isNaN(parseInt(page))) {
        articlesState.currentPage = parseInt(page);
    }
}

// 初始化文章页面
function initArticlesPage() {
    // 监听博客数据加载完成
    const checkDataInterval = setInterval(() => {
        if (state && state.allPosts && state.allPosts.length > 0) {
            clearInterval(checkDataInterval);
            
            // 更新分类选择器
            updateCategoryFilter();
            
            // 过滤并渲染文章
            filterAndRenderPosts();
            
            // 更新侧边栏
            updateSidebar();
        }
    }, 100);
    
    // 设置超时
    setTimeout(() => {
        clearInterval(checkDataInterval);
        if (!state || !state.allPosts || state.allPosts.length === 0) {
            showError('加载文章数据失败，请刷新页面重试');
        }
    }, 10000);
}

// 更新分类过滤器
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // 保存当前选择
    const currentValue = categoryFilter.value;
    
    // 清空现有选项
    categoryFilter.innerHTML = '<option value="">全部分类</option>';
    
    // 添加分类选项
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = `${category.name} (${category.count})`;
        categoryFilter.appendChild(option);
    });
    
    // 恢复选择
    if (currentValue) {
        categoryFilter.value = currentValue;
    } else if (articlesState.categoryFilter) {
        categoryFilter.value = articlesState.categoryFilter;
    }
}

// 过滤并渲染文章
function filterAndRenderPosts() {
    if (!state || !state.allPosts) {
        return;
    }
    
    // 过滤文章
    articlesState.filteredPosts = state.allPosts.filter(post => {
        // 分类过滤
        if (articlesState.categoryFilter && post.category !== articlesState.categoryFilter) {
            return false;
        }
        
        // 标签过滤
        if (articlesState.tagFilter && !post.tags.includes(articlesState.tagFilter)) {
            return false;
        }
        
        // 搜索过滤
        if (articlesState.searchQuery) {
            const query = articlesState.searchQuery.toLowerCase();
            return post.title.toLowerCase().includes(query) ||
                   post.excerpt.toLowerCase().includes(query) ||
                   post.tags.some(tag => tag.toLowerCase().includes(query));
        }
        
        return true;
    });
    
    // 排序文章
    sortPosts();
    
    // 渲染文章列表
    renderArticlesList();
    
    // 渲染分页
    renderPagination();
    
    // 更新URL
    updateUrl();
}

// 排序文章
function sortPosts() {
    articlesState.filteredPosts.sort((a, b) => {
        let comparison = 0;
        
        switch (articlesState.sortBy) {
            case 'date':
                comparison = a.date - b.date;
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
            default:
                comparison = 0;
        }
        
        return articlesState.sortOrder === 'asc' ? comparison : -comparison;
    });
}

// 渲染文章列表
function renderArticlesList() {
    const container = document.getElementById('articles-list');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    if (articlesState.filteredPosts.length === 0) {
        container.innerHTML = '<div class="empty">没有找到符合条件的文章</div>';
        return;
    }
    
    // 计算当前页的文章
    const startIndex = (articlesState.currentPage - 1) * articlesState.itemsPerPage;
    const endIndex = startIndex + articlesState.itemsPerPage;
    const paginatedPosts = articlesState.filteredPosts.slice(startIndex, endIndex);
    
    container.innerHTML = paginatedPosts.map(post => `
        <article class="post-list-item">
            <div class="post-list-thumbnail">
                <img src="assets/images/post-default.jpg" alt="${post.title}">
            </div>
            <div class="post-list-content">
                <h3 class="post-list-title">
                    <a href="article.html?path=${encodeURIComponent(post.path)}">${post.title}</a>
                </h3>
                <div class="post-list-meta">
                    <span class="post-date">${post.formattedDate}</span>
                    <span class="post-category">${post.category}</span>
                    ${post.tags.length > 0 ? `<span class="post-tags">标签: ${post.tags.map(tag => 
                        `<a href="tags.html?tag=${encodeURIComponent(tag)}">${tag}</a>`
                    ).join(', ')}</span>` : ''}
                </div>
                <p class="post-list-excerpt">${post.excerpt}</p>
                <a href="article.html?path=${encodeURIComponent(post.path)}" class="read-more">阅读全文</a>
            </div>
        </article>
    `).join('');
}

// 渲染分页
function renderPagination() {
    const container = document.getElementById('pagination');
    
    if (!container) {
        return;
    }
    
    const totalItems = articlesState.filteredPosts.length;
    const totalPages = Math.ceil(totalItems / articlesState.itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 上一页按钮
    html += `
        <button class="btn" onclick="changePage(${articlesState.currentPage - 1})" 
                ${articlesState.currentPage === 1 ? 'disabled' : ''}>
            上一页
        </button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= articlesState.currentPage - 2 && i <= articlesState.currentPage + 2)
        ) {
            html += `
                <button class="btn ${i === articlesState.currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (
            i === articlesState.currentPage - 3 ||
            i === articlesState.currentPage + 3
        ) {
            html += '<span class="ellipsis">...</span>';
        }
    }
    
    // 下一页按钮
    html += `
        <button class="btn" onclick="changePage(${articlesState.currentPage + 1})" 
                ${articlesState.currentPage === totalPages ? 'disabled' : ''}>
            下一页
        </button>
    `;
    
    container.innerHTML = html;
}

// 切换页面
function changePage(page) {
    const totalPages = Math.ceil(articlesState.filteredPosts.length / articlesState.itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    articlesState.currentPage = page;
    
    // 滚动到顶部
    window.scrollTo(0, 0);
    
    // 重新渲染
    renderArticlesList();
    renderPagination();
    
    // 更新URL
    updateUrl();
}

// 更新侧边栏
function updateSidebar() {
    // 更新分类列表
    const categoriesContainer = document.getElementById('sidebar-categories');
    if (categoriesContainer) {
        categoriesContainer.innerHTML = state.categories.map(category => `
            <div class="sidebar-category">
                <a href="articles.html?category=${encodeURIComponent(category.name)}" 
                   class="${articlesState.categoryFilter === category.name ? 'active' : ''}">
                    ${category.name} <span class="count">(${category.count})</span>
                </a>
            </div>
        `).join('');
    }
    
    // 更新标签云
    const tagsContainer = document.getElementById('sidebar-tags');
    if (tagsContainer) {
        const tags = Object.entries(state.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        tagsContainer.innerHTML = `
            <div class="tags-cloud">
                ${tags.map(([tag, count]) => `
                    <a href="articles.html?tag=${encodeURIComponent(tag)}" 
                       class="tag ${articlesState.tagFilter === tag ? 'active' : ''}">
                        ${tag} (${count})
                    </a>
                `).join('')}
            </div>
        `;
    }
}

// 更新URL
function updateUrl() {
    const params = new URLSearchParams();
    
    if (articlesState.categoryFilter) {
        params.set('category', articlesState.categoryFilter);
    }
    
    if (articlesState.tagFilter) {
        params.set('tag', articlesState.tagFilter);
    }
    
    if (articlesState.searchQuery) {
        params.set('query', articlesState.searchQuery);
    }
    
    if (articlesState.currentPage > 1) {
        params.set('page', articlesState.currentPage);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
}

// 显示错误信息
function showError(message) {
    const container = document.getElementById('articles-list');
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// 将changePage暴露为全局函数，以便HTML中的按钮调用
window.changePage = changePage; 