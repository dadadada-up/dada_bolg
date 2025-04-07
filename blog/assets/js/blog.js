/**
 * 博客前端 JavaScript
 * 通过GitHub API获取和展示博客内容
 */

// 配置
const config = {
    owner: 'dadadada-up',
    repo: 'dada_blog',
    branch: 'main',
    docsPath: 'content/posts',
    token: process.env.GITHUB_TOKEN=your_token_here  || '', // 从环境变量获取token
    endpoints: {
        contents: 'https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}',
        raw: 'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}',
        searchCode: 'https://api.github.com/search/code?q=repo:{owner}/{repo}+path:{path}'
    },
    cache: {
        ttl: 60 * 60 * 1000, // 缓存有效期1小时
        prefix: 'blog_'
    }
};

// 应用状态
const state = {
    categories: [],
    allPosts: [],
    featuredPosts: [],
    recentPosts: [],
    tags: {},
    isLoading: false
};

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initBlog();
    } catch (error) {
        console.error('博客初始化失败:', error);
        showError('博客加载失败，请稍后再试');
    }
});

// 初始化博客
async function initBlog() {
    state.isLoading = true;
    
    try {
        // 尝试从缓存加载数据
        if (loadFromCache()) {
            renderUI();
        }
        
        // 获取所有博客文章
        await fetchAllPosts();
        
        // 处理获取到的文章
        processPosts();
        
        // 保存到缓存
        saveToCache();
        
        // 渲染UI
        renderUI();
        
        state.isLoading = false;
    } catch (error) {
        state.isLoading = false;
        throw error;
    }
}

// 获取所有文章
async function fetchAllPosts() {
    try {
        console.log('开始获取所有文章...');
        
        // 获取所有分类目录
        const categoriesUrl = config.endpoints.contents
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{path}', config.docsPath)
            .replace('{branch}', config.branch);
        
        console.log('获取分类目录:', categoriesUrl);
        
        const categoriesResponse = await fetch(categoriesUrl, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!categoriesResponse.ok) {
            console.error('获取分类失败:', categoriesResponse.status, categoriesResponse.statusText);
            throw new Error('获取分类失败');
        }
        
        const categoriesData = await categoriesResponse.json();
        console.log('获取到的分类:', categoriesData);
        
        // 过滤出目录
        const categories = categoriesData.filter(item => item.type === 'dir');
        state.categories = categories.map(category => ({
            name: category.name,
            path: category.path,
            count: 0
        }));
        
        console.log('处理后的分类:', state.categories);
        
        // 遍历每个分类，获取文章
        state.allPosts = [];
        
        for (const category of categories) {
            console.log('处理分类:', category.name);
            
            const postsUrl = config.endpoints.contents
                .replace('{owner}', config.owner)
                .replace('{repo}', config.repo)
                .replace('{path}', category.path)
                .replace('{branch}', config.branch);
            
            console.log('获取文章列表:', postsUrl);
            
            const postsResponse = await fetch(postsUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!postsResponse.ok) {
                console.error(`获取分类 ${category.name} 的文章列表失败:`, postsResponse.status, postsResponse.statusText);
                continue;
            }
            
            const postsData = await postsResponse.json();
            console.log(`分类 ${category.name} 的文章列表:`, postsData);
            
            // 过滤出Markdown文件
            const posts = postsData.filter(item => item.type === 'file' && item.name.endsWith('.md'));
            
            // 获取每篇文章的内容
            for (const post of posts) {
                try {
                    console.log('处理文章:', post.path);
                    
                    // 获取文章内容
                    const postUrl = config.endpoints.raw
                        .replace('{owner}', config.owner)
                        .replace('{repo}', config.repo)
                        .replace('{branch}', config.branch)
                        .replace('{path}', post.path);
                    
                    console.log('获取文章内容:', postUrl);
                    
                    const postResponse = await fetch(postUrl, {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (!postResponse.ok) {
                        console.error(`获取文章 ${post.path} 失败:`, postResponse.status, postResponse.statusText);
                        continue;
                    }
                    
                    const postContent = await postResponse.text();
                    console.log(`文章 ${post.path} 内容获取成功`);
                    
                    // 解析文章内容
                    const parsedPost = parsePost(postContent, post.path, category.name);
                    
                    if (parsedPost) {
                        state.allPosts.push(parsedPost);
                        console.log(`文章 ${post.path} 解析成功`);
                    }
                } catch (error) {
                    console.error(`处理文章 ${post.path} 失败:`, error);
                }
            }
        }
        
        console.log('所有文章处理完成，共获取文章数:', state.allPosts.length);
    } catch (error) {
        console.error('获取文章失败:', error);
        throw error;
    }
}

// 解析文章内容
function parsePost(content, path, category) {
    try {
        // 解析YAML前言
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (!frontMatterMatch) {
            // 如果没有前言，尝试直接解析内容
            return {
                title: path.split('/').pop().replace('.md', ''),
                date: new Date(),
                formattedDate: formatDate(new Date()),
                category: category,
                subcategory: '',
                tags: [],
                description: '',
                excerpt: content.slice(0, 200) + '...',
                content: content.trim(),
                path: path,
                url: path.replace(config.docsPath, '').replace('.md', '.html'),
            };
        }
        
        const frontMatter = frontMatterMatch[1];
        const metadata = {};
        
        // 更健壮的前言解析
        frontMatter.split('\n').forEach(line => {
            if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    let value = valueParts.join(':').trim();
                    
                    // 处理带引号的值
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    
                    // 处理数组格式的值，如tags
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            const arrayContent = value.slice(1, -1);
                            metadata[key.trim()] = arrayContent.split(',').map(item => item.trim());
                        } catch (e) {
                            metadata[key.trim()] = value;
                        }
                    } else {
                        metadata[key.trim()] = value;
                    }
                }
            }
        });
        
        // 获取文章正文
        const contentBody = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
        
        // 计算摘要
        let excerpt = contentBody.replace(/#/g, '').trim().slice(0, 200);
        if (contentBody.length > 200) {
            excerpt += '...';
        }
        
        // 处理标签 - 支持字符串和数组两种格式
        let tags = [];
        if (metadata.tags) {
            if (Array.isArray(metadata.tags)) {
                tags = metadata.tags;
            } else if (typeof metadata.tags === 'string') {
                tags = metadata.tags.split(',').map(tag => tag.trim());
            }
        }
        
        // 处理日期
        const date = metadata.date ? new Date(metadata.date) : new Date();
        
        return {
            title: metadata.title || path.split('/').pop().replace('.md', ''),
            date: date,
            formattedDate: formatDate(date),
            category: metadata.categories ? (Array.isArray(metadata.categories) ? metadata.categories[0] : metadata.categories) : category,
            subcategory: metadata.subcategory || '',
            tags: tags,
            description: metadata.description || '',
            excerpt: metadata.description || excerpt,
            content: contentBody,
            path: path,
            url: path.replace(config.docsPath, '').replace('.md', '.html'),
        };
    } catch (error) {
        console.error(`解析文章 ${path} 失败:`, error);
        // 发生错误时，尝试返回一个基本对象
        return {
            title: path.split('/').pop().replace('.md', ''),
            date: new Date(),
            formattedDate: formatDate(new Date()),
            category: category,
            content: content.replace(/^---\n[\s\S]*?\n---/, '').trim() || content,
            path: path,
            url: path.replace(config.docsPath, '').replace('.md', '.html'),
        };
    }
}

// 处理获取到的文章
function processPosts() {
    if (!state.allPosts || state.allPosts.length === 0) {
        return;
    }
    
    // 按日期排序
    state.allPosts.sort((a, b) => b.date - a.date);
    
    // 提取推荐文章
    state.featuredPosts = state.allPosts.filter(post => post.featured).slice(0, 6);
    
    // 如果推荐文章不足，使用最新文章补充
    if (state.featuredPosts.length < 6) {
        const nonFeatured = state.allPosts.filter(post => !post.featured);
        state.featuredPosts = [
            ...state.featuredPosts,
            ...nonFeatured.slice(0, 6 - state.featuredPosts.length)
        ];
    }
    
    // 提取最新文章
    state.recentPosts = state.allPosts.slice(0, 10);
    
    // 更新分类计数
    state.categories.forEach(category => {
        category.count = state.allPosts.filter(post => post.category === category.name).length;
    });
    
    // 处理标签
    state.tags = {};
    state.allPosts.forEach(post => {
        post.tags.forEach(tag => {
            if (!state.tags[tag]) {
                state.tags[tag] = 0;
            }
            state.tags[tag]++;
        });
    });
}

// 渲染UI
function renderUI() {
    // 渲染推荐文章
    renderFeaturedPosts();
    
    // 渲染最新文章
    renderRecentPosts();
    
    // 渲染分类
    renderCategories();
    
    // 渲染标签云
    renderTagsCloud();
}

// 渲染推荐文章
function renderFeaturedPosts() {
    const container = document.getElementById('featured-posts-container');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    if (!state.featuredPosts || state.featuredPosts.length === 0) {
        container.innerHTML = '<div class="empty">暂无推荐文章</div>';
        return;
    }
    
    container.innerHTML = state.featuredPosts.map(post => `
        <article class="post-card">
            <div class="post-thumbnail">
                <img src="assets/images/post-default.jpg" alt="${post.title}">
            </div>
            <div class="post-content">
                <h3 class="post-title">
                    <a href="article.html?path=${encodeURIComponent(post.path)}">${post.title}</a>
                </h3>
                <div class="post-meta">
                    <span class="post-date">${post.formattedDate}</span>
                    <span class="post-category">${post.category}</span>
                </div>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="article.html?path=${encodeURIComponent(post.path)}" class="read-more">阅读全文</a>
            </div>
        </article>
    `).join('');
}

// 渲染最新文章
function renderRecentPosts() {
    const container = document.getElementById('recent-posts-container');
    
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
    
    container.innerHTML = state.recentPosts.map(post => `
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
            </div>
        </article>
    `).join('');
}

// 渲染分类
function renderCategories() {
    const container = document.getElementById('categories-container');
    
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
        <div class="category-card">
            <div class="category-icon">📁</div>
            <h3 class="category-name">${category.name}</h3>
            <div class="category-count">${category.count} 篇文章</div>
        </div>
    `).join('');
}

// 渲染标签云
function renderTagsCloud() {
    const container = document.getElementById('tags-cloud');
    
    if (!container) {
        return;
    }
    
    if (state.isLoading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
        return;
    }
    
    const tags = Object.entries(state.tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    
    if (tags.length === 0) {
        container.innerHTML = '<div class="empty">暂无标签</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="tags-cloud">
            ${tags.map(([tag, count]) => `
                <a href="tags.html?tag=${encodeURIComponent(tag)}" class="tag">${tag} (${count})</a>
            `).join('')}
        </div>
    `;
}

// 缓存相关函数
function saveToCache() {
    try {
        const cacheData = {
            timestamp: Date.now(),
            categories: state.categories,
            allPosts: state.allPosts,
            featuredPosts: state.featuredPosts,
            recentPosts: state.recentPosts,
            tags: state.tags
        };
        
        localStorage.setItem(`${config.cache.prefix}data`, JSON.stringify(cacheData));
    } catch (error) {
        console.error('缓存数据失败:', error);
    }
}

function loadFromCache() {
    try {
        const cachedData = localStorage.getItem(`${config.cache.prefix}data`);
        
        if (!cachedData) {
            return false;
        }
        
        const data = JSON.parse(cachedData);
        
        // 检查缓存是否过期
        if (Date.now() - data.timestamp > config.cache.ttl) {
            return false;
        }
        
        state.categories = data.categories;
        state.allPosts = data.allPosts;
        state.featuredPosts = data.featuredPosts;
        state.recentPosts = data.recentPosts;
        state.tags = data.tags;
        
        return true;
    } catch (error) {
        console.error('加载缓存数据失败:', error);
        return false;
    }
}

// 工具函数
function formatDate(date) {
    try {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return '未知日期';
    }
}

function showError(message) {
    const containers = [
        document.getElementById('featured-posts-container'),
        document.getElementById('recent-posts-container'),
        document.getElementById('categories-container'),
        document.getElementById('tags-cloud')
    ];
    
    containers.forEach(container => {
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    });
} 