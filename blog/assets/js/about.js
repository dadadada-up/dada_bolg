/**
 * 关于页面 JavaScript
 * 加载侧边栏数据和其他功能
 */

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化关于页面
    initAboutPage();
});

// 初始化关于页面
function initAboutPage() {
    // 监听博客数据加载完成
    const checkDataInterval = setInterval(() => {
        if (state && state.allPosts && state.allPosts.length > 0) {
            clearInterval(checkDataInterval);
            
            // 更新侧边栏
            updateSidebar();
        }
    }, 100);
    
    // 设置超时
    setTimeout(() => {
        clearInterval(checkDataInterval);
        if (!state || !state.allPosts || state.allPosts.length === 0) {
            // 即使数据加载失败，也不显示错误信息，因为这只是侧边栏
            updateSidebarWithEmptyData();
        }
    }, 5000);
}

// 更新侧边栏
function updateSidebar() {
    // 更新最新文章
    updateRecentPosts();
    
    // 更新分类
    updateCategories();
}

// 更新侧边栏最新文章
function updateRecentPosts() {
    const container = document.getElementById('sidebar-recent-posts');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    if (!state.recentPosts || state.recentPosts.length === 0) {
        container.innerHTML = '<div class="empty">暂无文章</div>';
        return;
    }
    
    // 显示最新的5篇文章
    const recentPosts = state.recentPosts.slice(0, 5);
    
    container.innerHTML = `
        <ul class="sidebar-posts-list">
            ${recentPosts.map(post => `
                <li>
                    <a href="article.html?path=${encodeURIComponent(post.path)}">
                        ${post.title}
                    </a>
                    <span class="post-date">${post.formattedDate}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

// 更新侧边栏分类
function updateCategories() {
    const container = document.getElementById('sidebar-categories');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    if (!state.categories || state.categories.length === 0) {
        container.innerHTML = '<div class="empty">暂无分类</div>';
        return;
    }
    
    container.innerHTML = `
        <ul class="sidebar-categories-list">
            ${state.categories.map(category => `
                <li>
                    <a href="categories.html?category=${encodeURIComponent(category.name)}">
                        ${category.name} <span class="category-count">(${category.count})</span>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
}

// 使用空数据更新侧边栏
function updateSidebarWithEmptyData() {
    const recentPostsContainer = document.getElementById('sidebar-recent-posts');
    const categoriesContainer = document.getElementById('sidebar-categories');
    
    if (recentPostsContainer) {
        recentPostsContainer.innerHTML = '<div class="empty">暂无文章</div>';
    }
    
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '<div class="empty">暂无分类</div>';
    }
} 