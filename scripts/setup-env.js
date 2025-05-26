/**
 * 设置环境变量并运行初始化脚本
 */

const { spawn } = require('child_process');
const path = require('path');

// 设置环境变量
process.env.TURSO_DATABASE_URL = 'libsql://dada-blog-db-dadadada-up.aws-ap-northeast-1.turso.io';
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDc0MDQwOTksImlkIjoiODU2YmRjMDMtMjQ0OC00ZDI4LTgyNjctYzA0NjgzMzdkYjQ2IiwicmlkIjoiYTIyZjg1MzMtNmIyMC00YzkxLWE5ZTctMTFkZThmNzI2NzgyIn0.-2bdfioxI_tjUbBNB1b9GGcpdAXdkUKAWKxiTYjKG-2mupabHL6qFtgLTjgueh41AE2IVcjB2U-9eDlL_5-XCA';

console.log('环境变量已设置');
console.log(`TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL}`);
console.log(`TURSO_AUTH_TOKEN 长度: ${process.env.TURSO_AUTH_TOKEN.length} 字符`);

// 运行初始化脚本
const scriptPath = path.join(__dirname, 'init-turso.js');
console.log(`运行脚本: ${scriptPath}`);

const child = spawn('node', [scriptPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  console.log(`脚本退出，退出码 ${code}`);
}); 