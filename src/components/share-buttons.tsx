"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
  className?: string;
}

export function ShareButtons({
  title,
  url,
  description = "",
  className,
}: ShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(url || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 在客户端获取当前URL
    if (!url && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const shareLinks = [
    {
      name: "微信",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8.69 13.181a.694.694 0 0 1-.693-.694.7.7 0 0 1 .693-.713.714.714 0 0 1 .714.713.708.708 0 0 1-.714.694m3.722 0a.7.7 0 0 1-.694-.694.714.714 0 0 1 .694-.713.701.701 0 0 1 .713.713.694.694 0 0 1-.713.694m-5.7-3.253a.587.587 0 0 1-.595-.583.59.59 0 0 1 .594-.6.617.617 0 0 1 .615.6.61.61 0 0 1-.615.583m3.169 0a.59.59 0 0 1-.594-.583.617.617 0 0 1 .594-.6.61.61 0 0 1 .616.6.602.602 0 0 1-.616.583m7.974 3.618c0 .49-.04.97-.12 1.44-1.04 4.76-5.27 8.12-10.001 8.12-.613 0-1.23-.04-1.834-.13l-1.87.94s-.54.27-.72-.18c-.03-.08-.05-.18-.04-.27l.34-2.08C1.53 18.8.56 16.52.56 14s.96-4.76 2.61-6.42C5.28 5.32 8.3 4 11.727 4 15.84 4 19.37 5.9 21.116 8.85c.445.79.719 1.66.719 2.57v.13l-.001-.005z" />
        </svg>
      ),
      onClick: () => {
        // 微信分享需要微信开发者工具，这里简化为复制链接
        copyToClipboard();
      },
    },
    {
      name: "微博",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.376 7.234c.437.964.392 2.255-.013 3.426-.031.089-.068.179-.113.268.835.446 1.427.955 1.427 1.71 0 2.913-4.925 6.62-10.95 6.62-5.128 0-10.003-2.389-10.003-6.16 0-1.8 1.053-3.889 2.873-5.865 2.446-2.66 5.318-4.148 6.673-2.89.603.558.7 1.514.29 2.645-.125.343.183.135.183.135s.41-.457.636-.983c.225-.525.27-1.14.225-1.318-.156-.602.175-.681.625-.681 0 0 2.803-.368 3.148 2.093zm-13.54 5.81c.135 1.728 1.98 2.994 4.113 2.832 2.136-.157 3.761-1.75 3.623-3.485-.134-1.73-1.977-3-4.113-2.838-2.135.157-3.76 1.756-3.623 3.49zm.838-.123c-.113 1.28 1.032 2.32 2.561 2.32 1.526 0 2.874-1.048 2.988-2.328.112-1.28-1.035-2.318-2.56-2.318-1.526 0-2.877 1.045-2.989 2.326zm2.016-.209c-.433.043-.76.435-.728.873.033.44.407.764.84.72.432-.045.76-.436.727-.875-.032-.44-.406-.763-.84-.72zm1.58 1.342c-.157.17-.442.186-.635.033-.19-.15-.207-.405-.05-.576.155-.17.44-.186.632-.034.192.151.209.406.054.576zm4.958-5.553c.368 0 .674-.232.787-.557.363-1.09.188-1.847-.517-2.158-.706-.31-1.884-.368-3.04.426-.293.2-.368.6-.165.89.202.292.606.365.901.165.63-.43 1.173-.437 1.469-.336.297.098.393.356.28.765-.114.407-.559.474-.843.335-.165-.082-.344-.127-.528-.127-.501 0-.93.335-1.053.795-.123.46.157.935.62 1.057.46.124.931-.142 1.053-.603.034-.128.045-.259.034-.384.335-.14.786-.268 1.002-.268z" />
        </svg>
      ),
      href: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
        currentUrl
      )}&title=${encodeURIComponent(title)}`,
    },
    {
      name: "QQ",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29 0 2.239.425 6.287.687 6.287 0 0-.688-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" />
        </svg>
      ),
      href: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(
        currentUrl
      )}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(
        description
      )}`,
    },
    {
      name: "复制链接",
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      ),
      onClick: copyToClipboard,
    },
  ];

  function copyToClipboard() {
    if (navigator.clipboard && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {shareLinks.map((link) => (
        <div
          key={link.name}
          className="relative inline-block"
          title={link.name}
        >
          {link.href ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={`分享到${link.name}`}
            >
              {link.icon}
            </a>
          ) : (
            <button
              onClick={link.onClick}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={`分享到${link.name}`}
            >
              {link.icon}
            </button>
          )}
          {link.name === "复制链接" && copied && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs py-1 px-2 rounded whitespace-nowrap">
              链接已复制
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 