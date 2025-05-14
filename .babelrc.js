module.exports = {
  presets: ['next/babel'],
  plugins: [
    // 禁用服务器端渲染中的fetch操作
    ['transform-define', {
      'global.BROWSER': false,
      'process.env.VERCEL': 'true',
      'process.env.IS_VERCEL': '1',
      'process.env.NEXT_PUBLIC_IS_VERCEL': '1',
    }]
  ]
};
