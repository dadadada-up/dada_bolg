import { MainLayout } from "@/components/layout/main-layout";

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">关于我的博客</h1>
        
        <section className="mb-12 prose dark:prose-invert">
          <h2>博客简介</h2>
          <p>
            欢迎来到我的个人博客! 这是一个基于 Next.js 开发的博客平台，内容从我的 GitHub 仓库中获取。
            在这里，我会分享我对技术的思考、生活感悟以及各种有趣的经历。
          </p>
          <p>
            博客使用 Markdown 格式编写文章，支持代码高亮、图片展示、表格等丰富的内容呈现方式。
            通过分类和标签系统，你可以轻松找到感兴趣的内容。
          </p>
        </section>
        
        <section className="mb-12 prose dark:prose-invert">
          <h2>关于我</h2>
          <p>
            我是一名热爱技术的开发者，对前端开发、React 生态、服务端渲染和 TypeScript 有特别的兴趣。
            平时喜欢探索新技术，并在实践中不断学习和成长。
          </p>
          <p>
            除了编程，我还喜欢阅读、旅行和尝试新事物。通过这个博客，我希望能记录下我的成长轨迹，
            同时也希望能与更多志同道合的朋友交流和分享。
          </p>
        </section>
        
        <section className="mb-12 prose dark:prose-invert">
          <h2>技术栈</h2>
          <p>本博客使用以下技术构建：</p>
          <ul>
            <li>Next.js 14 - React 框架</li>
            <li>TypeScript - 类型安全的 JavaScript</li>
            <li>Tailwind CSS - 实用优先的 CSS 框架</li>
            <li>GitHub API - 内容管理</li>
            <li>Vercel - 部署和托管</li>
          </ul>
        </section>
        
        <section className="prose dark:prose-invert">
          <h2>联系我</h2>
          <p>
            如果你有任何问题、建议或者想法，欢迎通过以下方式联系我：
          </p>
          <ul>
            <li>
              <strong>GitHub:</strong>{" "}
              <a 
                href="https://github.com/dadadada-up" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @dadadada-up
              </a>
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a 
                href="mailto:example@example.com" 
                className="text-primary hover:underline"
              >
                example@example.com
              </a>
            </li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
} 