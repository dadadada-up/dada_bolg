#!/bin/bash

# 脚本创建.env.local文件

cat > .env.local << EOF
# Turso数据库连接信息
TURSO_DATABASE_URL=libsql://dada-blog-db-dadadada-up.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=TEMP_TOKEN_FOR_TESTING_123456789

# 本地数据库路径
DB_PATH=./data/blog.db

# 数据库备份目录
BACKUP_DIR=./data/backups

# Turso数据库名称
TURSO_DB_NAME=dada-blog-db

# 备份保留天数
MAX_DAYS=30
EOF

echo ".env.local文件已创建" 