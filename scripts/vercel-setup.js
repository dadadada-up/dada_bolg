/**
 * Vercel部署前设置脚本
 * 此脚本在Vercel构建时运行，确保环境正确设置
 */

console.log('🚀 Vercel部署前准备开始...');

// 设置环境变量标记
process.env.VERCEL = '1';
process.env.IS_VERCEL = '1';
process.env.NEXT_PUBLIC_IS_VERCEL = '1';

// 检查Turso配置
if (!process.env.TURSO_DATABASE_URL) {
  console.error('❌ 错误: 未设置TURSO_DATABASE_URL环境变量');
  console.error('请在Vercel项目设置中配置此环境变量');
  process.exit(1);
}

if (!process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ 错误: 未设置TURSO_AUTH_TOKEN环境变量');
  console.error('请在Vercel项目设置中配置此环境变量');
  process.exit(1);
}

// 确保网站URL正确设置
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn('⚠️ 警告: 未设置NEXT_PUBLIC_SITE_URL环境变量');
  console.warn('将使用默认值: https://dada-blog.vercel.app');
  process.env.NEXT_PUBLIC_SITE_URL = 'https://dada-blog.vercel.app';
}

// 测试Turso连接 (可选)
async function testTursoConnection() {
  try {
    const { createClient } = await import('@libsql/client');
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    
    const result = await client.execute('SELECT 1 as test');
    if (result.rows[0]?.test === 1) {
      console.log('✅ Turso数据库连接测试成功!');
    } else {
      console.warn('⚠️ Turso连接测试返回异常结果', result);
    }
  } catch (error) {
    console.error('❌ Turso数据库连接测试失败:', error.message);
    // 不退出，允许构建继续
  }
}

// 在生产构建中不进行连接测试，避免安装额外依赖
if (process.env.NODE_ENV !== 'production') {
  testTursoConnection().catch(err => {
    console.error('Turso连接测试出错:', err);
  });
} else {
  console.log('ℹ️ 生产环境构建: 跳过数据库连接测试');
}

console.log('✅ Vercel部署前准备完成');
console.log('📊 环境信息:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
console.log(`- TURSO_DATABASE: ${process.env.TURSO_DATABASE_URL.substring(0, 20)}...`);

// 导出配置用于其他脚本
module.exports = {
  isVercel: true,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  tursoUrl: process.env.TURSO_DATABASE_URL
}; 