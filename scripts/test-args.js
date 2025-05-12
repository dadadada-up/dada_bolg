/**
 * 命令行参数测试脚本
 */

console.log('===== 命令行参数测试 =====');
console.log('process.argv:');
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});

console.log('\n===== 环境变量测试 =====');
console.log('GITHUB_TOKEN 长度:', process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0);
console.log('DEBUG_MODE:', process.env.DEBUG_MODE); 