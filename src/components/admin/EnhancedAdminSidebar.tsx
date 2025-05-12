'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiMenu, FiX } from 'react-icons/fi';

export function EnhancedAdminSidebar() {
  const pathname = usePathname();
  // 默认展开状态
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 重置侧边栏状态
  const resetSidebarState = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sidebarCollapsed');
        localStorage.removeItem('sidebarCollapsedInitialized');
        localStorage.removeItem('sidebarMobileVisited');
        setCollapsed(isMobile); // 桌面展开，移动收起
      }
    } catch (e) {
      console.error('无法重置侧边栏状态:', e);
    }
  };
  
  // 强制初始状态为展开 (用于调试)
  useEffect(() => {
    // 在非移动设备上强制重置状态
    if (!isMobile) {
      // 添加一个版本标记，以便在需要时重置所有用户的设置
      const currentVersion = '1.0.1';
      const savedVersion = localStorage.getItem('sidebarVersion');
      
      if (savedVersion !== currentVersion) {
        // 重置侧边栏
        localStorage.setItem('sidebarCollapsed', 'false'); // 默认展开
        localStorage.setItem('sidebarCollapsedInitialized', 'true');
        localStorage.setItem('sidebarVersion', currentVersion);
        setCollapsed(false);
      }
    }
  }, [isMobile]);
  
  // 检测窗口大小
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // 只在移动设备上默认收起
      if (mobile && typeof window !== 'undefined') {
        if (!localStorage.getItem('sidebarMobileVisited')) {
          setCollapsed(true);
          localStorage.setItem('sidebarMobileVisited', 'true');
        }
      }
    };
    
    // 初始检测
    checkMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    
    // 清理监听
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 从本地存储加载侧边栏状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 先尝试获取初始化状态标志
        const initialized = localStorage.getItem('sidebarCollapsedInitialized');
        
        // 获取保存的状态
        const savedState = localStorage.getItem('sidebarCollapsed');
        
        // 如果已初始化并保存了状态，使用保存的状态
        if (initialized === 'true' && savedState !== null) {
          console.log('使用保存的状态: ', savedState);
          setCollapsed(savedState === 'true');
        } else {
          // 否则，设置默认状态：桌面展开，移动收起
          const defaultState = isMobile;
          console.log('使用默认状态: ', defaultState);
          setCollapsed(defaultState);
          
          // 初始化本地存储
          localStorage.setItem('sidebarCollapsed', defaultState ? 'true' : 'false');
          localStorage.setItem('sidebarCollapsedInitialized', 'true');
        }
        
        // 设置定时器，定期检查localStorage中的状态
        const checkStateInterval = setInterval(() => {
          try {
            const currentState = localStorage.getItem('sidebarCollapsed');
            if (currentState !== null) {
              const newCollapsed = currentState === 'true';
              // 使用函数式更新，访问最新的状态值
              setCollapsed(prevCollapsed => {
                if (prevCollapsed !== newCollapsed) {
                  return newCollapsed;
                }
                return prevCollapsed;
              });
            }
          } catch (e) {
            console.error('检查侧边栏状态出错:', e);
          }
        }, 200); // 200ms检查一次，减少性能消耗
        
        return () => {
          clearInterval(checkStateInterval);
        };
      } catch (e) {
        // 处理localStorage访问错误
        console.error('无法访问localStorage:', e);
        // 使用默认值
        setCollapsed(isMobile);
      }
    }
  }, [isMobile]);
  
  // 保存侧边栏状态到本地存储
  const toggleSidebar = () => {
    console.log("切换侧边栏状态", collapsed, "->", !collapsed); // 添加调试日志
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };
  
  // 确定当前活动的菜单项
  const isActive = (path: string) => {
    // 如果是首页路径精确匹配
    if (path === '/admin' && pathname === '/admin') {
      return true;
    }
    
    // 文章列表只在点击文章列表时高亮
    if (path === '/admin' && pathname !== '/admin') {
      return false;
    }
    
    // 仪表盘需要精确匹配仪表盘路径
    if (path === '/admin/dashboard' && pathname === '/admin/dashboard') {
      return true;
    }
    
    // 其他子路径使用前缀匹配
    if (path !== '/admin' && pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };
  
  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">DA</div>
        {!collapsed && <h1 className="sidebar-title">达达的博客</h1>}
      </div>
      
      <nav className="sidebar-nav">
        <NavSection title="仪表盘" collapsed={collapsed}>
          <NavItem 
            href="/admin/dashboard" 
            active={isActive('/admin/dashboard')}
            icon="📊"
            collapsed={collapsed}
          >
            统计概览
          </NavItem>
        </NavSection>
        
        <NavSection title="内容管理" collapsed={collapsed}>
          <NavItem 
            href="/admin/posts" 
            active={isActive('/admin/posts')}
            icon="📄"
            collapsed={collapsed}
          >
            文章列表
          </NavItem>
          <NavItem 
            href="/admin/categories" 
            active={isActive('/admin/categories')}
            icon="🗂️"
            collapsed={collapsed}
          >
            分类管理
          </NavItem>
          <NavItem 
            href="/admin/tags" 
            active={isActive('/admin/tags')}
            icon="🏷️"
            collapsed={collapsed}
          >
            标签管理
          </NavItem>
        </NavSection>
        
        <NavSection title="同步与备份" collapsed={collapsed}>
          <NavItem 
            href="/admin/sync" 
            active={isActive('/admin/sync')}
            icon="🔄"
            collapsed={collapsed}
          >
            同步管理
          </NavItem>
          <NavItem 
            href="/admin/maintenance" 
            active={isActive('/admin/maintenance')}
            icon="🛠️"
            collapsed={collapsed}
          >
            系统维护
          </NavItem>
        </NavSection>
        
        <NavSection title="系统" collapsed={collapsed}>
          <NavItem 
            href="/admin/settings" 
            active={isActive('/admin/settings')}
            icon="⚙️"
            collapsed={collapsed}
          >
            设置
          </NavItem>
          <NavItem 
            href="/" 
            active={false}
            icon="🏠"
            collapsed={collapsed}
          >
            返回前台
          </NavItem>
        </NavSection>
      </nav>
      
      {/* 折叠按钮放到最下方 */}
      <div className="sidebar-footer">
        <button 
          className="collapse-toggle" 
          onClick={toggleSidebar}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isMobile 
            ? (collapsed ? <FiMenu /> : <FiX />)
            : (collapsed ? <FiChevronRight className="toggle-icon" /> : <FiChevronLeft className="toggle-icon" />)
          }
        </button>
      </div>
      
      {/* 移动设备上的关闭背景遮罩 */}
      {isMobile && !collapsed && (
        <div 
          className="mobile-sidebar-backdrop"
          onClick={toggleSidebar}
          aria-label="关闭侧边栏"
        />
      )}
    </aside>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}

function NavSection({ title, children, collapsed }: NavSectionProps) {
  return (
    <div className="nav-section">
      {!collapsed && <div className="nav-section-title">{title}</div>}
      <ul className="nav-items">
        {children}
      </ul>
    </div>
  );
}

interface NavItemProps {
  href: string;
  active: boolean;
  icon?: string;
  children: React.ReactNode;
  collapsed: boolean;
}

function NavItem({ href, active, icon, children, collapsed }: NavItemProps) {
  return (
    <li className={`nav-item ${active ? 'active' : ''}`} title={collapsed ? String(children) : undefined}>
      <Link href={href} prefetch={false}>
        {icon && <span className="nav-icon">{icon}</span>}
        {!collapsed && <span className="nav-label">{children}</span>}
      </Link>
    </li>
  );
} 