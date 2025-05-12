import { Loading } from "@/components/loading";
import { MainLayout } from "@/components/layout/main-layout";

export default function PostsLoading() {
  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto">
        <div className="mb-12 animate-pulse">
          <div className="h-10 w-48 bg-muted rounded mb-4"></div>
          <div className="h-6 w-32 bg-muted rounded"></div>
        </div>
        
        <div className="space-y-8">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-7 w-3/4 bg-muted rounded mb-4"></div>
              <div className="h-4 w-32 bg-muted rounded mb-6"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </div>
              <div className="flex gap-2 mt-6">
                <div className="h-6 w-16 bg-muted rounded-full"></div>
                <div className="h-6 w-16 bg-muted rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 