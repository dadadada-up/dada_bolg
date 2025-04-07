/**
 * 分类页面 JavaScript
 * 加载和显示博客文章分类
 */

// 分类页面状态
const categoriesState = {
    selectedCategory: null,
    categoryPosts: []
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化分类页面
    initCategoriesPage();
});

// 初始化分类页面
function initCategoriesPage() {
    // 检查URL参数中是否有指定分类
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
        categoriesState.selectedCategory = decodeURIComponent(categoryParam);
    }
    
    // 监听博客数据加载完成
    const checkDataInterval = setInterval(() => {
        if (state && state.categories && state.categories.length > 0) {
            clearInterval(checkDataInterval);
            
            // 加载并渲染分类
            renderCategories();
            
            // 如果有选定分类，显示该分类的文章
            if (categoriesState.selectedCategory) {
                showCategoryPosts(categoriesState.selectedCategory);
            }
            
            // 更新侧边栏
            updateSidebar();
        }
    }, 100);
    
    // 设置超时
    setTimeout(() => {
        clearInterval(checkDataInterval);
        if (!state || !state.categories || state.categories.length === 0) {
            showError('加载分类数据失败，请刷新页面重试');
        }
    }, 5000);
}

// 渲染分类列表
function renderCategories() {
    const container = document.getElementById('categories-list');
    
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
    
    container.innerHTML = state.categories.map(category => `
        <div class="category-card ${categoriesState.selectedCategory === category.name ? 'active' : ''}" 
             data-category="${category.name}" onclick="showCategoryPosts('${category.name}')">
            <div class="category-icon">📁</div>
            <h3 class="category-name">${category.name}</h3>
            <div class="category-count">${category.count} 篇文章</div>
        </div>
    `).join('');
}

// 显示分类文章
function showCategoryPosts(categoryName) {
    // 更新选定的分类
    categoriesState.selectedCategory = categoryName;
    
    // 更新URL，不刷新页面
    const url = new URL(window.location);
    url.searchParams.set('category', encodeURIComponent(categoryName));
    window.history.pushState({}, '', url);
    
    // 高亮显示选中的分类卡片
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        if (card.getAttribute('data-category') === categoryName) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // 过滤该分类的文章
    categoriesState.categoryPosts = state.allPosts.filter(post => post.category === categoryName);
    
    // 按日期排序（最新的在前）
    categoriesState.categoryPosts.sort((a, b) => b.date - a.date);
    
    // 创建分类文章区域（如果不存在）
    let categoryPostsSection = document.getElementById('category-posts');
    
    if (!categoryPostsSection) {
        categoryPostsSection = document.createElement('section');
        categoryPostsSection.id = 'category-posts';
        categoryPostsSection.className = 'category-posts';
        
        const mainContent = document.querySelector('main');
        mainContent.appendChild(categoryPostsSection);
    }
    
    // 渲染分类标题和文章列表
    categoryPostsSection.innerHTML = `
        <h3 class="category-title">${categoryName} 分类的文章</h3>
        <div class="posts-list">
            ${renderCategoryPostsList()}
        </div>
    `;
    
    // 滚动到分类文章区域
    categoryPostsSection.scrollIntoView({ behavior: 'smooth' });
}

// 渲染分类文章列表
function renderCategoryPostsList() {
    if (categoriesState.categoryPosts.length === 0) {
        return '<div class="empty">该分类下暂无文章</div>';
    }
    
    return categoriesState.categoryPosts.map(post => `
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
                </div>
                <p class="post-list-excerpt">${post.excerpt}</p>
                <a href="article.html?path=${encodeURIComponent(post.path)}" class="read-more">阅读全文</a>
            </div>
        </article>
    `).join('');
}

// 更新侧边栏
function updateSidebar() {
    // 更新侧边栏标签
    const tagsContainer = document.getElementById('sidebar-tags');
    
    if (tagsContainer) {
        const tags = Object.entries(state.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        if (tags.length === 0) {
            tagsContainer.innerHTML = '<div class="empty">暂无标签</div>';
            return;
        }
        
        tagsContainer.innerHTML = `
            <div class="sidebar-tags-cloud">
                ${tags.map(([tag, count]) => `
                    <a href="tags.html?tag=${encodeURIComponent(tag)}" class="tag">${tag} (${count})</a>
                `).join('')}
            </div>
        `;
    }
}

// 显示错误信息
function showError(message) {
    const containers = [
        document.getElementById('categories-list'),
        document.getElementById('category-posts')
    ];
    
    containers.forEach(container => {
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    });
}

// 暴露给全局的函数
window.showCategoryPosts = showCategoryPosts; 