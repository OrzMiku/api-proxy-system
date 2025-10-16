# 代码规范快速参考

> 完整文档请参阅 [CODE-STANDARDS.md](./CODE-STANDARDS.md)

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置编辑器

推荐使用 VSCode，已配置好的设置文件位于 `.vscode/` 目录。

**必需扩展**:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

打开项目时，VSCode 会自动提示安装推荐扩展。

### 3. 代码检查

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format

# TypeScript 类型检查
pnpm type-check
```

## 📋 核心规范速查

### 命名约定

```typescript
// PascalCase: 类、接口、类型、枚举
interface UserProfile {}
type ApiResponse = {}

// camelCase: 变量、函数、方法
const userName = 'John'
function fetchData() {}

// UPPER_SNAKE_CASE: 常量
const MAX_RETRY_ATTEMPTS = 3

// kebab-case: 文件名
// user-profile.tsx, use-providers.ts
```

### TypeScript

```typescript
// ✅ 优先使用接口
interface User {
  id: number
  name: string
}

// ✅ 明确处理 null/undefined
const timeout = config.timeout ?? 30000

// ✅ 使用类型守卫
if (isSuccessResponse(response)) {
  console.log(response.data)
}

// ❌ 避免使用 any
// const data: any = fetchData()
```

### React 组件

```typescript
// ✅ Server Components (默认)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ Client Components (需要交互时)
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### 数据库 (Drizzle)

```typescript
// ✅ 使用 identity columns (2025 标准)
id: integer('id').primaryKey().generatedAlwaysAsIdentity()

// ✅ 只选择需要的字段
const providers = await db
  .select({
    id: providers.id,
    name: providers.name,
  })
  .from(providers)

// ✅ 使用类型推导
type Provider = InferSelectModel<typeof providers>
type NewProvider = InferInsertModel<typeof providers>
```

### Redis

```typescript
// ✅ 使用单例实例
import { redis } from '@/lib/redis'

// ✅ 使用命名规范
const key = RedisKeys.endpointHealth(providerId)

// ✅ 使用 pipeline 批量操作
const pipeline = redis.pipeline()
pipeline.hset(key1, data1)
pipeline.hset(key2, data2)
await pipeline.exec()
```

### 认证安全

```typescript
// ✅ 使用数据访问层 (DAL)
import { getProviders } from '@/lib/dal' // 自动包含认证

// ✅ Server Actions 必须验证认证
export async function createProvider(data: FormData) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  // ...
}

// ✅ 使用 Zod 验证输入
const validated = providerSchema.parse(data)
```

## 🔧 常用命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
pnpm lint:fix

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 数据库迁移
pnpm db:generate  # 生成迁移文件
pnpm db:push      # 应用迁移
pnpm db:studio    # 打开 Drizzle Studio

# 测试
pnpm test
pnpm test:watch
pnpm test:e2e
```

## 📁 项目结构

```
api-proxy-system/
├── app/                  # Next.js App Router
│   ├── (auth)/          # 认证路由组
│   ├── admin/           # 管理后台
│   ├── api/             # API Routes
│   └── layout.tsx       # 根布局
├── components/          # React 组件
│   ├── ui/              # shadcn/ui 组件
│   ├── providers/       # 提供商相关组件
│   └── shared/          # 共享组件
├── lib/                 # 工具函数和库
│   ├── db.ts            # 数据库连接
│   ├── redis.ts         # Redis 连接
│   ├── auth.ts          # 认证工具
│   └── dal.ts           # 数据访问层
├── schema/              # Drizzle ORM schemas
├── types/               # TypeScript 类型定义
└── hooks/               # 自定义 React Hooks
```

## 🎯 重要提示

### 安全

- ❌ **不要只依赖中间件进行认证** (CVE-2025-29927)
- ✅ **在每个 Server Component、Server Action、API Route 中验证认证**
- ✅ **使用数据访问层 (DAL) 模式**

### 性能

- ✅ 使用 Server Components 减少客户端 JavaScript
- ✅ 数据库查询只选择需要的字段
- ✅ 使用 Redis 缓存频繁访问的数据
- ✅ 使用 Pipeline 批量操作 Redis

### 代码质量

- ✅ 严格的 TypeScript 配置，避免 `any`
- ✅ 使用 ESLint 和 Prettier 保持代码一致性
- ✅ 编写单元测试和集成测试
- ✅ 遵循 Conventional Commits 规范

## 📚 参考资源

- [完整代码规范](./CODE-STANDARDS.md)
- [产品需求文档](./API-PROXY-PRD.md)
- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs)

## 🤝 贡献

在提交代码前，请确保：

1. ✅ 代码通过 ESLint 检查 (`pnpm lint`)
2. ✅ 代码格式化正确 (`pnpm format`)
3. ✅ TypeScript 类型检查通过 (`pnpm type-check`)
4. ✅ 所有测试通过 (`pnpm test`)
5. ✅ Commit 消息遵循规范

---

**最后更新**: 2025-10-17
