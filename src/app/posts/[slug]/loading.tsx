import { MainLayout } from "@/components/layout/main-layout";

export default function PostDetailLoading() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-10 w-3/4 bg-muted rounded mb-4"></div>
          <div className="flex gap-2 items-center">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-3 w-3 bg-muted rounded-full"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
        
        <div className="lg:flex gap-8">
          <aside className="hidden lg:block sticky top-20 h-fit w-64 shrink-0">
            <div className="border rounded-lg p-4 animate-pulse">
              <div className="h-5 w-20 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 ml-3 w-11/12 bg-muted rounded"></div>
                <div className="h-4 ml-3 w-10/12 bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </div>
            </div>
          </aside>
          
          <div className="flex-1 animate-pulse">
            <div className="prose dark:prose-invert max-w-none space-y-4">
              {Array(20).fill(0).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full"></div>
              ))}
              
              <div className="h-6 w-3/4 bg-muted rounded mt-8"></div>
              
              {Array(10).fill(0).map((_, i) => (
                <div key={`p-${i}`} className="h-4 bg-muted rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 