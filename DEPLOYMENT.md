# 部署指南

本文档提供 API 代理系统的详细部署步骤，包括开发环境和生产环境的配置。

## 目录

- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [环境变量配置](#环境变量配置)
- [数据库设置](#数据库设置)
- [初始化数据](#初始化数据)
- [常见问题](#常见问题)

## 开发环境部署

### 1. 环境要求

- **Node.js**: >= 18.17.0
- **pnpm**: >= 8.0.0
- **Redis**: >= 7.0（推荐使用 [Upstash](https://upstash.com/) 或本地 Redis）

### 2. 克隆项目

```bash
git clone <repository-url>
cd claude-code-api-proxy
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# 数据库配置（SQLite）
DATABASE_URL="file:./dev.db"

# Redis 配置
REDIS_URL="redis://localhost:6379"
# 或使用 Upstash Redis
# REDIS_URL="rediss://default:YOUR_PASSWORD@your-instance.upstash.io:6379"

# NextAuth 配置
NEXTAUTH_SECRET="生成一个随机密钥"
NEXTAUTH_URL="http://localhost:3000"

# 加密配置
ENCRYPTION_KEY="生成一个随机密钥"

# 应用配置
NODE_ENV="development"
APP_NAME="API Proxy System"
APP_URL="http://localhost:3000"

# 日志配置
LOG_LEVEL="info"
```

**生成密钥**：

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成 ENCRYPTION_KEY
openssl rand -base64 32
```

### 5. 初始化数据库

```bash
# 生成数据库迁移文件（如果有 schema 变更）
pnpm db:generate

# 应用迁移到数据库
pnpm db:push
```

### 6. 初始化测试数据（可选）

```bash
# 创建测试数据（providers, groups, API keys）
npx tsx -r dotenv/config scripts/seed-test-data.ts
```

### 7. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 生产环境部署

### 使用 Vercel 部署（推荐）

#### 1. 准备 Redis

使用 [Upstash](https://upstash.com/) 创建 Redis 实例（推荐）：

1. 注册 Upstash 账号
2. 创建 Redis 数据库
3. 复制连接 URL（格式：`rediss://default:xxx@xxx.upstash.io:6379`）

#### 2. 部署到 Vercel

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置环境变量：
   - `DATABASE_URL`: 使用 Vercel Postgres 或 SQLite（`file:./prod.db`）
   - `REDIS_URL`: Upstash Redis URL
   - `NEXTAUTH_SECRET`: 生成的随机密钥
   - `NEXTAUTH_URL`: 你的域名（如 `https://your-domain.vercel.app`）
   - `ENCRYPTION_KEY`: 生成的随机密钥
   - `NODE_ENV`: `production`
   - `LOG_LEVEL`: `warn`

4. 部署：

```bash
pnpm build
```

5. 初始化数据库（在 Vercel Dashboard 的 Terminal 中执行）：

```bash
pnpm db:push
```

### 使用 Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=file:./prod.db
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NODE_ENV=production
    depends_on:
      - redis
    volumes:
      - ./data:/app/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

#### 3. 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 初始化数据库
docker-compose exec app pnpm db:push
```

### 使用自己的服务器部署

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 构建应用

```bash
pnpm install --frozen-lockfile
pnpm build
```

#### 3. 配置 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'api-proxy',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

#### 4. 启动应用

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 环境变量配置

### 必需变量

| 变量名            | 说明                          | 示例                              |
| ----------------- | ----------------------------- | --------------------------------- |
| `DATABASE_URL`    | 数据库连接 URL                | `file:./dev.db` 或 PostgreSQL URL |
| `REDIS_URL`       | Redis 连接 URL                | `redis://localhost:6379`          |
| `NEXTAUTH_SECRET` | NextAuth 密钥                 | 随机生成的 32 字节字符串          |
| `NEXTAUTH_URL`    | 应用 URL                      | `http://localhost:3000`           |
| `ENCRYPTION_KEY`  | 加密密钥（用于加密 API Keys） | 随机生成的 32 字节字符串          |

### 可选变量

| 变量名                    | 说明                 | 默认值             |
| ------------------------- | -------------------- | ------------------ |
| `NODE_ENV`                | 环境                 | `development`      |
| `APP_NAME`                | 应用名称             | `API Proxy System` |
| `LOG_LEVEL`               | 日志级别             | `info`             |
| `RATE_LIMIT_WINDOW_MS`    | 速率限制窗口（毫秒） | `60000`            |
| `RATE_LIMIT_MAX_REQUESTS` | 默认速率限制         | `100`              |

## 数据库设置

### SQLite（开发和小规模生产）

```env
DATABASE_URL="file:./dev.db"
```

优点：

- 无需额外安装
- 文件存储，易于备份
- 适合小规模应用

缺点：

- 不支持并发写入
- 不适合高并发场景

### PostgreSQL（推荐用于生产）

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

优点：

- 高性能
- 支持高并发
- 功能强大

### 迁移到 PostgreSQL

1. 安装 PostgreSQL
2. 创建数据库
3. 更新 `DATABASE_URL`
4. 运行迁移：

```bash
pnpm db:push
```

## 初始化数据

### 创建管理员用户

目前系统使用 NextAuth.js，需要通过以下方式创建管理员：

1. 启动应用
2. 访问 `/api/auth/signin` 登录
3. 首次登录的用户自动成为管理员

### 创建 API Key

使用提供的脚本创建测试 API Key：

```bash
npx tsx -r dotenv/config scripts/create-test-api-key.ts
```

这将创建一个全局 API Key（可访问所有 groups），脚本会输出：

```
✅ API Key created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 API Key (save this - it will not be shown again):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

apx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 配置 Providers 和 Groups

通过管理后台（`/admin`）配置：

1. **创建 Provider**：
   - Name: 名称（如 "OpenAI"）
   - Base URL: API 基础 URL（如 `https://api.openai.com`）
   - API Key: Provider 的 API 密钥
   - Timeout: 超时时间（毫秒）

2. **创建 Group**：
   - Name: 组名（如 "Production"）
   - Slug: URL 友好的标识符（如 `prod`）
   - Description: 描述

3. **关联 Provider 到 Group**：
   - 选择 Group
   - 添加 Provider
   - 设置优先级（数值越高优先级越高）

## 常见问题

### Q: 为什么需要 Redis？

A: Redis 用于：

- 缓存 Provider 列表和健康状态
- 实现速率限制
- 缓存 API Key 验证结果
- 存储性能统计数据

### Q: 可以不使用 Redis 吗？

A: 不推荐。Redis 是系统核心组件，移除会严重影响性能和功能。

### Q: 如何备份数据？

A: **SQLite**:

```bash
cp dev.db dev.db.backup
```

**PostgreSQL**:

```bash
pg_dump dbname > backup.sql
```

### Q: 如何更新系统？

```bash
# 拉取最新代码
git pull

# 安装依赖
pnpm install

# 生成并应用数据库迁移
pnpm db:generate
pnpm db:push

# 重新构建
pnpm build

# 重启应用
pm2 restart api-proxy
```

### Q: 性能优化建议？

1. **使用 PostgreSQL** 替代 SQLite（生产环境）
2. **启用 Redis 持久化** 防止数据丢失
3. **配置 CDN** 加速静态资源
4. **使用负载均衡** 分散流量
5. **监控系统** 使用 PM2、Datadog 或 New Relic
6. **调整 Next.js 配置**：
   ```js
   // next.config.ts
   export default {
     output: 'standalone',
     compress: true,
     poweredByHeader: false,
   }
   ```

### Q: 如何调试问题？

1. **查看日志**：

   ```bash
   # 开发环境
   pnpm dev

   # 生产环境（PM2）
   pm2 logs api-proxy

   # Docker
   docker-compose logs -f app
   ```

2. **设置日志级别**：

   ```env
   LOG_LEVEL=debug
   ```

3. **使用 Drizzle Studio** 查看数据库：

   ```bash
   pnpm db:studio
   ```

4. **检查 Redis 连接**：
   ```bash
   redis-cli ping
   ```

## 安全建议

1. **使用强密钥**：确保 `NEXTAUTH_SECRET` 和 `ENCRYPTION_KEY` 是随机生成的
2. **启用 HTTPS**：生产环境必须使用 HTTPS
3. **定期更新依赖**：`pnpm update`
4. **限制访问**：配置防火墙规则，只允许必要的端口
5. **监控日志**：定期检查异常活动
6. **备份数据**：设置自动备份策略

## 监控和维护

### 健康检查端点

系统提供健康检查端点（需要实现）：

```bash
curl http://localhost:3000/api/health
```

### 性能监控

1. **Redis 监控**：

   ```bash
   redis-cli INFO stats
   ```

2. **数据库监控**：
   使用 Drizzle Studio 查看查询性能

3. **应用监控**：
   - PM2: `pm2 monit`
   - Vercel: 内置分析
   - 使用 APM 工具（如 New Relic、Datadog）

## 支持

如有问题，请：

1. 查看 [常见问题](#常见问题)
2. 查看 [代码文档](./CLAUDE.md)
3. 提交 Issue
