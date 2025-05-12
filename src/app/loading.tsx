import { Loading } from "@/components/loading";

export default function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loading size="large" text="页面加载中..." />
    </div>
  );
} 