declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    GITHUB_TOKEN=your_token_here : string;
    GITHUB_REPO_OWNER: string;
    GITHUB_REPO_NAME: string;
  }
} 