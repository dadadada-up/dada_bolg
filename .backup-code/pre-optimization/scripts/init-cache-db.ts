import initCacheDb from '../src/lib/cache.ts';

async function main() {
  try {
    console.log('正在初始化缓存数据库...');
    await initCacheDb();
    console.log('缓存数据库初始化完成！');
  } catch (error) {
    console.error('初始化缓存数据库失败:', error);
    process.exit(1);
  }
}

main(); 