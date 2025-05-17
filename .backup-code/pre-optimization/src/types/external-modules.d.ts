declare module 'clsx' {
  type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];
  
  export default function clsx(...inputs: ClassValue[]): string;
  export type { ClassValue };
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: string[]): string;
}

declare module 'gray-matter' {
  interface GrayMatterFile<T = any> {
    data: T;
    content: string;
    excerpt?: string;
    path?: string;
    isEmpty?: boolean;
    orig: Buffer | string;
  }

  function matter<T = any>(
    input: string | Buffer,
    options?: any
  ): GrayMatterFile<T>;

  export = matter;
}

declare module 'octokit' {
  export class Octokit {
    constructor(options?: { auth?: string });
    
    rest: {
      repos: {
        getContent(params: { owner: string; repo: string; path: string }): Promise<{
          data: any | any[];
        }>;
      };
    };
  }
} 