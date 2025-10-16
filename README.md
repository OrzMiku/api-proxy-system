# API 代理轮询系统

高可用的 API 聚合和负载均衡系统，基于 Next.js 15、Drizzle ORM、Redis 和 TypeScript 构建。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5.7
- **数据库**: PostgreSQL + Drizzle ORM
- **缓存**: Redis (ioredis)
- **认证**: NextAuth.js v5
- **UI**: Tailwind CSS 4 + shadcn/ui
- **包管理**: pnpm

## 快速开始

### 环境要求

- Node.js >= 18.17.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 7

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

复制 `.env.example` 到 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

### 数据库迁移

```bash
pnpm db:generate
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

访问 <http://localhost:3000>

## 项目结构

```text
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # 管理后台
│   └── globals.css        # 全局样式 (Tailwind CSS 4)
├── components/            # React 组件
│   └── ui/               # shadcn/ui 组件
├── lib/                   # 工具函数
├── schema/                # Drizzle ORM schemas
├── types/                 # TypeScript 类型定义
├── hooks/                 # 自定义 React Hooks
├── drizzle/              # 数据库迁移文件
└── public/               # 静态资源
```

## 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行 ESLint
- `pnpm format` - 格式化代码
- `pnpm type-check` - TypeScript 类型检查
- `pnpm db:generate` - 生成数据库迁移
- `pnpm db:push` - 推送数据库迁移
- `pnpm db:studio` - 打开 Drizzle Studio

## 文档

- **[产品需求文档](./docs/API-PROXY-PRD.md)** - 详细的产品需求和技术设计
- **[代码规范](./docs/CODE-STANDARDS.md)** - 开发规范和最佳实践
- **[代码规范（省流版）](./docs/CODE-STANDARDS.md)** - 开发规范和最佳实践

## License

MIT
