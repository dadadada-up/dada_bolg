// Next.js 核心模块类型声明

declare module 'next/link' {
  import React from 'react';
  
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
  }
  
  const Link: React.ForwardRefExoticComponent<
    LinkProps & React.RefAttributes<HTMLAnchorElement>
  >;
  
  export default Link;
}

declare module "next" {
  import { NextPage } from "next/types";
  import { ReactNode } from "react";

  export interface Metadata {
    title?: string;
    description?: string;
    keywords?: string | string[];
    authors?: { name: string; url?: string } | Array<{ name: string; url?: string }>;
    metadataBase?: URL;
    alternates?: {
      canonical?: string;
      languages?: Record<string, string>;
      media?: Record<string, string>;
      types?: Record<string, string>;
    };
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      siteName?: string;
      images?: string | Array<{ url: string; width?: number; height?: number; alt?: string }>;
      locale?: string;
      type?: string;
      publishedTime?: string;
      authors?: string[];
      tags?: string[];
    };
    twitter?: {
      card?: "summary" | "summary_large_image" | "app" | "player";
      title?: string;
      description?: string;
      images?: string | string[];
      creator?: string;
      site?: string;
    };
    robots?: {
      index?: boolean;
      follow?: boolean;
      nocache?: boolean;
      noarchive?: boolean;
      noimageindex?: boolean;
      notranslate?: boolean;
    };
    other?: Record<string, any>;
  }

  export { NextPage };
}

declare module "next/navigation" {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    prefetch: (url: string) => void;
    back: () => void;
    forward: () => void;
  };

  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function notFound(): never;
}

declare module "next/server" {
  import { NextRequest } from "next/server";

  export type { NextRequest };
  
  export interface NextResponse {
    json: (body: any, init?: ResponseInit) => Response;
    redirect: (url: string, init?: number | ResponseInit) => Response;
    rewrite: (url: string) => Response;
    next: (init?: ResponseInit) => Response;
  }
  
  export function NextResponse(
    body?: BodyInit | null,
    init?: ResponseInit
  ): NextResponse;

  export function revalidatePath(
    path: string,
    type?: "page" | "layout"
  ): void;
  
  export function revalidateTag(tag: string): void;
}

declare module 'next/font/google' {
  export interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    preload?: boolean;
    variable?: string;
    fallback?: string[];
    adjustFontFallback?: boolean | string;
  }
  
  export function Inter(options?: FontOptions): {
    className: string;
    style: React.CSSProperties;
  };
} 