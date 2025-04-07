/**
 * 标签页面 JavaScript
 * 加载和显示博客文章标签
 */

// 标签页面状态
const tagsState = {
    selectedTag: null,
    tagPosts: []
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化标签页面
    initTagsPage();
});

// 初始化标签页面
function initTagsPage() {
    // 检查URL参数中是否有指定标签
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    
    if (tagParam) {
        tagsState.selectedTag = decodeURIComponent(tagParam);
    }
    
    // 监听博客数据加载完成
    const checkDataInterval = setInterval(() => {
        if (state && state.tags && Object.keys(state.tags).length > 0) {
            clearInterval(checkDataInterval);
            
            // 渲染标签云
            renderTagsCloud();
            
            // 如果有选定标签，显示该标签的文章
            if (tagsState.selectedTag) {
                showTagPosts(tagsState.selectedTag);
            }
            
            // 更新侧边栏
            updateSidebar();
        }
    }, 100);
    
    // 设置超时
    setTimeout(() => {
        clearInterval(checkDataInterval);
        if (!state || !state.tags || Object.keys(state.tags).length === 0) {
            showError('加载标签数据失败，请刷新页面重试');
        }
    }, 5000);
}

// 渲染标签云
function renderTagsCloud() {
    const container = document.getElementById('tags-cloud-container');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    const tags = Object.entries(state.tags);
    
    if (tags.length === 0) {
        container.innerHTML = '<div class="empty">暂无标签</div>';
        return;
    }
    
    // 按标签数量排序
    tags.sort((a, b) => b[1] - a[1]);
    
    // 计算标签字体大小
    const maxCount = tags[0][1];
    const minCount = tags[tags.length - 1][1];
    const fontRange = 2.2 - 0.8; // 最大字体2.2em，最小字体0.8em
    
    container.innerHTML = tags.map(([tag, count]) => {
        // 计算标签字体大小，根据文章数量缩放
        let fontSize = 0.8;
        if (maxCount !== minCount) {
            fontSize = 0.8 + ((count - minCount) / (maxCount - minCount)) * fontRange;
        }
        
        // 选中的标签高亮显示
        const isActive = tagsState.selectedTag === tag ? 'active' : '';
        
        return `
            <a href="javascript:void(0)" 
               onclick="showTagPosts('${tag}')" 
               class="tag ${isActive}" 
               data-tag="${tag}"
               style="font-size: ${fontSize.toFixed(1)}em">
                ${tag} <span class="tag-count">(${count})</span>
            </a>
        `;
    }).join('');
}

// 显示标签文章
function showTagPosts(tag) {
    // 更新选定的标签
    tagsState.selectedTag = tag;
    
    // 更新URL，不刷新页面
    const url = new URL(window.location);
    url.searchParams.set('tag', encodeURIComponent(tag));
    window.history.pushState({}, '', url);
    
    // 高亮显示选中的标签
    const tagLinks = document.querySelectorAll('#tags-cloud-container .tag');
    tagLinks.forEach(link => {
        if (link.getAttribute('data-tag') === tag) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // 更新标题
    const tagTitleElement = document.getElementById('current-tag-title');
    if (tagTitleElement) {
        tagTitleElement.textContent = `标签: ${tag}`;
    }
    
    // 过滤该标签的文章
    tagsState.tagPosts = state.allPosts.filter(post => post.tags.includes(tag));
    
    // 按日期排序（最新的在前）
    tagsState.tagPosts.sort((a, b) => b.date - a.date);
    
    // 渲染标签文章列表
    const tagArticlesList = document.getElementById('tag-articles-list');
    if (tagArticlesList) {
        if (tagsState.tagPosts.length === 0) {
            tagArticlesList.innerHTML = '<div class="empty">该标签下暂无文章</div>';
        } else {
            tagArticlesList.innerHTML = tagsState.tagPosts.map(post => `
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
    }
    
    // 滚动到文章列表
    const tagArticles = document.getElementById('tag-articles');
    if (tagArticles) {
        tagArticles.scrollIntoView({ behavior: 'smooth' });
    }
}

// 更新侧边栏
function updateSidebar() {
    // 更新侧边栏分类
    const categoriesContainer = document.getElementById('sidebar-categories');
    
    if (categoriesContainer) {
        if (!state.categories || state.categories.length === 0) {
            categoriesContainer.innerHTML = '<div class="empty">暂无分类</div>';
            return;
        }
        
        categoriesContainer.innerHTML = `
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
}

// 显示错误信息
function showError(message) {
    const containers = [
        document.getElementById('tags-cloud-container'),
        document.getElementById('tag-articles-list')
    ];
    
    containers.forEach(container => {
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    });
}

// 暴露给全局的函数
window.showTagPosts = showTagPosts; 