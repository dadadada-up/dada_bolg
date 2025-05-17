// 检查Turso环境变量
require('dotenv').config({ path: '.env.local' });

console.log('环境变量检测:');
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? '已设置' : '未设置');
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? '已设置' : '未设置');

// 检查isTursoEnabled函数逻辑
const isTursoEnabled = () => {
  const enabled = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;
  console.log(`Turso是否启用: ${enabled}`);
  return enabled;
};

console.log('isTursoEnabled():', isTursoEnabled());
