"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 在客户端渲染后再显示组件
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 确定当前使用的图标
  const ThemeIcon = React.useMemo(() => {
    if (!mounted) return null;
    
    if (theme === "system") {
      return <MonitorIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />;
    } 
    
    return resolvedTheme === "dark" ? (
      <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
    ) : (
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
    );
  }, [theme, resolvedTheme, mounted]);

  if (!mounted) {
    // 在挂载前显示占位符避免布局偏移
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-9 h-9 rounded-md"
        aria-label="切换主题"
      >
        <div className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-9 h-9 rounded-md"
          aria-label="选择主题"
        >
          {ThemeIcon}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <SunIcon className="h-4 w-4" />
          <span>亮色</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MoonIcon className="h-4 w-4" />
          <span>暗色</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MonitorIcon className="h-4 w-4" />
          <span>系统</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 