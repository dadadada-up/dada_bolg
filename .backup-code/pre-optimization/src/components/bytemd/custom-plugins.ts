import type { BytemdPlugin } from 'bytemd';

export function customZhPlugin(): BytemdPlugin {
  return {
    viewerEffect({ markdownBody }) {
      // 这里是Viewer特定的效果
    },
    editorEffect({ editor }) {
      // 这部分是在编辑器加载后执行的代码
      // 因为ByteMD的工具栏提示是由第三方库Tippy.js生成的
      // 我们需要直接干预DOM来修改这些提示
      
      // 定义要替换的词汇
      const translations: Record<string, string> = {
        'Task list': '任务列表',
        'Ordered list': '有序列表',
        'Unordered list': '无序列表',
        'Bold': '粗体',
        'Italic': '斜体',
        'Quote': '引用',
        'Code': '代码',
        'Link': '链接',
        'Image': '图片',
        'Table': '表格',
        'Heading': '标题',
        'Horizontal rule': '分隔线',
        'Undo': '撤销',
        'Redo': '重做',
        // 数学公式相关
        'Inline formula': '行内公式',
        'Block formula': '块级公式',
        'Formula': '公式',
        'Math': '数学公式',
        // 其他可能的工具栏项
        'Strikethrough': '删除线',
        'Inline Code': '行内代码',
        'Code Block': '代码块',
        'Upload Image': '上传图片',
        'Fullscreen': '全屏',
        'Preview': '预览',
        'Edit': '编辑',
        'Format': '格式化',
        'Checklist': '任务列表',
        'Check list': '任务列表'
      };
      
      // 创建一个函数来应用翻译
      const applyTranslations = () => {
        // 查找所有包含英文的工具栏按钮
        const toolbarButtons = document.querySelectorAll('.bytemd-toolbar button[title]');
        toolbarButtons.forEach((btn) => {
          const title = btn.getAttribute('title');
          if (title && translations[title]) {
            btn.setAttribute('title', translations[title]);
          }
        });
        
        // 查找提示气泡
        const tooltips = document.querySelectorAll('.tippy-content');
        tooltips.forEach((tooltip) => {
          const content = tooltip.textContent;
          if (content && translations[content]) {
            tooltip.textContent = translations[content];
          }
        });
        
        // 查找下拉菜单项
        const menuItems = document.querySelectorAll('.bytemd-dropdown-item, .bytemd-dropdown-content, .bytemd-dropdown-title');
        menuItems.forEach((item) => {
          const content = item.textContent?.trim();
          if (content && translations[content]) {
            item.textContent = translations[content];
          }
        });
        
        // 特殊处理数学公式下拉菜单
        const mathItems = document.querySelectorAll('.tippy-box[data-theme="bytemd"] div');
        mathItems.forEach((item) => {
          const content = item.textContent?.trim();
          if (content && translations[content]) {
            item.textContent = translations[content];
          }
        });
        
        // 特殊处理公式下拉菜单
        const formulaMenus = document.querySelectorAll('[data-tippy-root] div');
        formulaMenus.forEach((item) => {
          const content = item.textContent?.trim();
          if (content && translations[content]) {
            item.textContent = translations[content];
          }
        });
        
        // 处理所有弹出菜单
        const allPopupItems = document.querySelectorAll('body > div.tippy-box *');
        allPopupItems.forEach((item) => {
          if (item.nodeType === Node.TEXT_NODE) {
            const content = item.textContent?.trim();
            if (content && translations[content]) {
              item.textContent = translations[content];
            }
          } else if (item.childNodes.length === 1 && item.firstChild?.nodeType === Node.TEXT_NODE) {
            const content = item.textContent?.trim();
            if (content && translations[content]) {
              item.textContent = translations[content];
            }
          }
        });
      };
      
      // 创建一个MutationObserver来监听DOM变化
      const observer = new MutationObserver((mutations) => {
        applyTranslations();
      });
      
      // 开始观察文档变化
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title']
      });
      
      // 定期检查和更新工具栏
      const intervalId = setInterval(applyTranslations, 500);
      
      // 初始执行一次翻译
      setTimeout(applyTranslations, 100);
      
      // 返回清理函数
      return () => {
        observer.disconnect();
        clearInterval(intervalId);
      };
    }
  };
} 