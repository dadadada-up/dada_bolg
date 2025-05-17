import 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

declare module 'next-themes' {
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    resolvedTheme: string | undefined;
    themes: string[];
  };
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
}

declare module 'rehype-prism-plus' {
  const rehypePrism: any;
  export default rehypePrism;
}

declare module 'unified' {
  export function unified(): any;
}

declare module 'remark-parse' {
  const remarkParse: any;
  export default remarkParse;
}

declare module 'remark-rehype' {
  const remarkRehype: any;
  export default remarkRehype;
}

declare module 'rehype-stringify' {
  const rehypeStringify: any;
  export default rehypeStringify;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
} 