import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 获取需要重新验证的slug
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const path = searchParams.get("path");
    
    // 根据参数重新验证不同的路径
    if (slug) {
      // 重新验证指定文章页面
      revalidatePath(`/posts/${slug}`);
      console.log(`[重新验证] 已重新验证文章页面: /posts/${slug}`);
      
      // 也重新验证首页和分类页面，因为它们可能会显示该文章
      revalidatePath("/", "page");
      revalidatePath("/categories", "page");
      revalidatePath("/tags", "page");
    } else if (path) {
      // 重新验证指定路径
      revalidatePath(path);
      console.log(`[重新验证] 已重新验证路径: ${path}`);
    } else {
      // 如果没有指定路径，重新验证所有主要页面
      revalidatePath("/", "layout");
      console.log("[重新验证] 已重新验证整个站点");
    }
    
    return Response.json({
      success: true,
      message: "页面已重新验证"
    });
  } catch (error) {
    console.error(`[重新验证] 失败:`, error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : "重新验证失败"
      },
      { status: 500 }
    );
  }
}

// 也支持GET方法以便于测试
export async function GET(request: NextRequest) {
  return POST(request);
}
