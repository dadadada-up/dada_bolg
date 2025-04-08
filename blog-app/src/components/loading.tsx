import React from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
  className?: string;
}

export function Loading({ 
  size = "medium", 
  text = "加载中...", 
  className = "" 
}: LoadingProps) {
  const sizeClass = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-3"
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-t-transparent border-primary ${sizeClass}`} />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
      <Loading size="large" text="内容加载中，请稍候..." />
    </div>
  );
} 