import Link from "next/link";

export function HeroSection() {
  return (
    <div className="rounded-lg border bg-card/50 shadow-sm mb-10">
      <div className="px-6 py-10 md:py-16 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
          欢迎来到 Dada 的博客
        </h1>
        <p className="text-base md:text-lg mb-6 text-muted-foreground">
          技术探索与生活随想的个人空间
        </p>
        <div className="flex justify-center">
          <Link 
            href="/posts" 
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium transition-all hover:bg-primary/90"
          >
            探索文章
          </Link>
        </div>
      </div>
    </div>
  );
} 