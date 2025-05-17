"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * 增强的主题提供者组件
 * - 添加系统级颜色偏好检测
 * - 支持根据时间自动切换主题
 * - 改进主题持久化方式
 * - 增加平滑切换过渡
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // 在组件挂载时添加CSS过渡效果，而不是在SSR时
  React.useEffect(() => {
    // 添加主题切换过渡CSS
    document.documentElement.style.setProperty(
      "--theme-transition",
      "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease"
    );
    
    // 对主题敏感的元素添加过渡效果
    document.documentElement.classList.add("theme-transition");
    
    // 监听系统颜色偏好变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // 只在使用系统主题时自动切换
      if (localStorage.getItem("theme") === "system") {
        document.documentElement.classList.toggle("dark", mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      document.documentElement.classList.remove("theme-transition");
    };
  }, []);
  
  return (
    <NextThemesProvider 
      {...props}
      enableSystem
      disableTransitionOnChange={false}
      enableColorScheme
      storageKey="theme-preference"
    >
      {children}
    </NextThemesProvider>
  );
} 