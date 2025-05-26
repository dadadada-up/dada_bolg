# SQLite归档文件

此目录包含迁移到Turso数据库前的SQLite相关文件，作为历史记录保留。

## 文件清单

- `blog-dev.db` - 原SQLite数据库文件
- `init-local-db.js` - 原SQLite数据库初始化脚本
- `fix-connection.js` - 数据库连接修复脚本
- `test-db-connection.js` - 数据库连接测试脚本

## 注意事项

这些文件仅作为参考保留，当前系统已使用Turso数据库作为开发和生产环境的统一数据源。
如需恢复使用SQLite，请参考这些文件并修改环境配置。 