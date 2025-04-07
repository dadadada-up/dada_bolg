/**
 * 文章详情页面 JavaScript
 * 加载和显示单篇文章内容
 */

// 文章页面状态
const articleState = {
    currentArticle: null,
    relatedArticles: [],
    prevArticle: null,
    nextArticle: null
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化文章页
    initArticlePage();
});

// 初始化文章页
async function initArticlePage() {
    // 获取URL参数中的文章路径
    const urlParams = new URLSearchParams(window.location.search);
    const articlePath = urlParams.get('path');
    
    if (!articlePath) {
        showArticleError('未指定文章路径');
        return;
    }
    
    // 监听博客数据加载完成
    const checkDataInterval = setInterval(() => {
        if (state && state.allPosts && state.allPosts.length > 0) {
            clearInterval(checkDataInterval);
            
            // 尝试从已加载的文章中查找
            const article = state.allPosts.find(post => post.path === articlePath);
            
            if (article) {
                // 找到文章，显示内容
                displayArticle(article);
            } else {
                // 没有找到文章，尝试直接加载
                loadArticleFromPath(articlePath);
            }
        }
    }, 100);
    
    // 设置超时
    setTimeout(() => {
        clearInterval(checkDataInterval);
        if (!state || !state.allPosts || state.allPosts.length === 0) {
            // 直接尝试加载文章
            loadArticleFromPath(articlePath);
        }
    }, 5000);
}

// 从路径加载文章
async function loadArticleFromPath(path) {
    try {
        // 构建文章URL
        const articleUrl = config.endpoints.raw
            .replace('{owner}', config.owner)
            .replace('{repo}', config.repo)
            .replace('{branch}', config.branch)
            .replace('{path}', path);
        
        // 显示加载中
        document.getElementById('article-loading').style.display = 'block';
        document.getElementById('article-error').style.display = 'none';
        
        // 获取文章内容
        const response = await fetch(articleUrl);
        
        if (!response.ok) {
            throw new Error('获取文章内容失败');
        }
        
        const content = await response.text();
        
        // 解析文章内容
        const category = path.split('/')[1] || '未分类'; // 假设路径格式为 content/posts/category/article.md
        const parsedArticle = parsePost(content, path, category);
        
        if (!parsedArticle) {
            throw new Error('解析文章内容失败');
        }
        
        // 显示文章
        displayArticle(parsedArticle);
    } catch (error) {
        console.error('加载文章失败:', error);
        showArticleError('加载文章失败: ' + error.message);
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
                content: content.trim(),
                path: path
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
            content: contentBody,
            path: path
        };
    } catch (error) {
        console.error('解析文章内容失败:', error);
        // 发生错误时，尝试返回一个基本对象
        return {
            title: path.split('/').pop().replace('.md', ''),
            date: new Date(),
            formattedDate: formatDate(new Date()),
            category: category,
            content: content.replace(/^---\n[\s\S]*?\n---/, '').trim() || content,
            path: path
        };
    }
}

// 显示文章内容
function displayArticle(article) {
    // 保存当前文章
    articleState.currentArticle = article;
    
    // 更新文档标题
    document.title = `${article.title} - dada的博客`;
    
    // 更新文章头部
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-date').textContent = article.formattedDate;
    document.getElementById('article-category').textContent = article.category;
    
    // 更新文章标签
    const tagsContainer = document.getElementById('article-tags');
    if (article.tags && article.tags.length > 0) {
        tagsContainer.innerHTML = article.tags.map(tag => 
            `<a href="tags.html?tag=${encodeURIComponent(tag)}" class="article-tag">${tag}</a>`
        ).join('');
    } else {
        tagsContainer.style.display = 'none';
    }
    
    // 渲染文章内容
    const articleBody = document.getElementById('article-body');
    articleBody.innerHTML = marked.parse(article.content);
    
    // 处理文章中的链接
    processArticleLinks();
    
    // 生成目录
    generateTableOfContents();
    
    // 查找相关文章
    findRelatedArticles();
    
    // 查找上一篇和下一篇文章
    findPrevNextArticles();
    
    // 隐藏加载中，显示文章内容
    document.getElementById('article-loading').style.display = 'none';
    document.getElementById('article-header').style.display = 'block';
    document.getElementById('article-body').style.display = 'block';
    document.getElementById('article-navigation').style.display = 'flex';
}

// 显示文章错误
function showArticleError(message) {
    document.getElementById('article-loading').style.display = 'none';
    
    const errorElement = document.getElementById('article-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// 处理文章中的链接
function processArticleLinks() {
    const links = document.querySelectorAll('#article-body a');
    
    links.forEach(link => {
        // 如果是外部链接，添加新窗口打开属性
        if (link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// 生成文章目录
function generateTableOfContents() {
    const headings = document.querySelectorAll('#article-body h1, #article-body h2, #article-body h3, #article-body h4');
    const tocContainer = document.getElementById('article-toc');
    
    if (headings.length === 0) {
        tocContainer.innerHTML = '<div class="empty">文章没有目录</div>';
        return;
    }
    
    const toc = document.createElement('ul');
    
    headings.forEach((heading, index) => {
        // 为每个标题添加ID
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }
        
        const level = parseInt(heading.tagName.substring(1));
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.classList.add(`toc-h${level}`);
        
        // 点击滚动到对应位置
        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth' });
        });
        
        listItem.appendChild(link);
        toc.appendChild(listItem);
    });
    
    tocContainer.innerHTML = '';
    tocContainer.appendChild(toc);
    
    // 添加滚动监听，高亮当前查看的标题
    window.addEventListener('scroll', highlightTocOnScroll);
}

// 滚动时高亮目录项
function highlightTocOnScroll() {
    const headings = document.querySelectorAll('#article-body h1, #article-body h2, #article-body h3, #article-body h4');
    const tocLinks = document.querySelectorAll('#article-toc a');
    
    if (headings.length === 0 || tocLinks.length === 0) {
        return;
    }
    
    // 找到当前视窗中最靠前的标题
    let currentHeadingIndex = 0;
    const scrollPos = window.scrollY;
    
    for (let i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop > scrollPos + 100) {
            break;
        }
        currentHeadingIndex = i;
    }
    
    // 移除所有高亮
    tocLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 高亮当前标题
    if (tocLinks[currentHeadingIndex]) {
        tocLinks[currentHeadingIndex].classList.add('active');
    }
}

// 查找相关文章
function findRelatedArticles() {
    if (!state || !state.allPosts || !articleState.currentArticle) {
        return;
    }
    
    const currentArticle = articleState.currentArticle;
    const relatedContainer = document.getElementById('related-posts');
    
    // 相关性评分函数
    function calculateRelatedness(article) {
        if (article.path === currentArticle.path) {
            return -1; // 排除当前文章
        }
        
        let score = 0;
        
        // 同分类加分
        if (article.category === currentArticle.category) {
            score += 3;
        }
        
        // 标签匹配加分
        const commonTags = article.tags.filter(tag => currentArticle.tags.includes(tag));
        score += commonTags.length * 2;
        
        return score;
    }
    
    // 计算相关性并排序
    const relatedArticles = state.allPosts
        .map(article => ({
            article: article,
            score: calculateRelatedness(article)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.article);
    
    articleState.relatedArticles = relatedArticles;
    
    // 显示相关文章
    if (relatedArticles.length === 0) {
        relatedContainer.innerHTML = '<div class="empty">没有相关文章</div>';
    } else {
        relatedContainer.innerHTML = relatedArticles.map(article => `
            <div class="related-post">
                <h4 class="related-title">
                    <a href="article.html?path=${encodeURIComponent(article.path)}">${article.title}</a>
                </h4>
                <div class="related-meta">
                    <span>${article.formattedDate}</span> · 
                    <span>${article.category}</span>
                </div>
            </div>
        `).join('');
    }
}

// 查找上一篇和下一篇文章
function findPrevNextArticles() {
    if (!state || !state.allPosts || !articleState.currentArticle) {
        return;
    }
    
    const currentArticle = articleState.currentArticle;
    const allPosts = [...state.allPosts];
    
    // 按日期排序
    allPosts.sort((a, b) => b.date - a.date);
    
    // 查找当前文章的索引
    const currentIndex = allPosts.findIndex(article => article.path === currentArticle.path);
    
    if (currentIndex === -1) {
        return;
    }
    
    // 获取上一篇和下一篇
    const prevArticle = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    const nextArticle = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    
    articleState.prevArticle = prevArticle;
    articleState.nextArticle = nextArticle;
    
    // 显示导航
    const prevContainer = document.getElementById('article-prev');
    const nextContainer = document.getElementById('article-next');
    
    if (prevArticle) {
        prevContainer.innerHTML = `
            <a href="article.html?path=${encodeURIComponent(prevArticle.path)}">
                <div class="nav-label">上一篇</div>
                <div class="nav-title">${prevArticle.title}</div>
            </a>
        `;
    } else {
        prevContainer.innerHTML = '';
    }
    
    if (nextArticle) {
        nextContainer.innerHTML = `
            <a href="article.html?path=${encodeURIComponent(nextArticle.path)}">
                <div class="nav-label">下一篇</div>
                <div class="nav-title">${nextArticle.title}</div>
            </a>
        `;
    } else {
        nextContainer.innerHTML = '';
    }
}

// 格式化日期
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