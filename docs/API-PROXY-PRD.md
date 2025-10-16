# API 代理轮询系统 - 产品需求文档 (PRD)

**版本**: 1.0
**日期**: 2025-10-17
**作者**: AI Assistant

---

## 1. 项目概述

### 1.1 项目背景

本项目旨在构建一个高可用的 API 代理轮询系统，用于聚合和负载均衡多个相同接口格式的 API 端点。由于不同的 API 提供商提供相同格式的接口但稳定性和性能各异，系统需要智能地在多个端点之间进行轮询，以提高整体服务的可用性和性能。

### 1.2 核心价值

- **高可用性**: 通过智能轮询和故障转移，确保服务持续可用
- **统一接口**: 向客户端提供单一、稳定的 API 端点
- **灵活管理**: 通过管理后台动态管理 API 提供商和分组
- **性能优化**: 使用 Redis 缓存和智能路由算法优化响应时间
- **安全可控**: 多层级的 API Key 管理和鉴权机制

### 1.3 目标用户

- 需要聚合多个 API 提供商的开发者
- 需要提高 API 服务可用性的团队
- 需要统一管理和监控多个 API 端点的运维人员

---

## 2. 技术栈选型

### 2.1 技术栈总览

| 类别         | 技术选择                | 版本   | 说明                            |
| ------------ | ----------------------- | ------ | ------------------------------- |
| 前后端框架   | Next.js                 | 15.x   | React 全栈框架，支持 App Router |
| UI 组件库    | shadcn/ui               | latest | 基于 Radix UI 的组件库          |
| CSS 框架     | Tailwind CSS            | 3.x    | 实用优先的 CSS 框架             |
| ORM          | Drizzle ORM             | latest | 轻量级、类型安全的 ORM          |
| 数据库       | PostgreSQL/MySQL/SQLite | -      | 通过 Drizzle 支持多种数据库     |
| 缓存         | Redis                   | 7.x    | 用于轮询状态和性能优化          |
| Redis 客户端 | ioredis                 | 5.x    | 功能丰富的 Redis 客户端         |
| 认证         | NextAuth.js             | 5.x    | 开源认证解决方案                |
| 运行时       | Node.js                 | 18.x+  | JavaScript 运行时               |
| 包管理器     | pnpm                    | 8.x+   | 快速、节省磁盘空间的包管理器    |

### 2.2 技术选型详细分析

#### 2.2.1 ORM 选择: Drizzle ORM

**对比分析**

| 特性            | Drizzle ORM               | Prisma                                                      | TypeORM           |
| --------------- | ------------------------- | ----------------------------------------------------------- | ----------------- |
| 性能            | ⭐⭐⭐⭐⭐ 最快           | ⭐⭐⭐ 中等                                                 | ⭐⭐⭐ 中等       |
| Bundle 大小     | ⭐⭐⭐⭐⭐ 最小           | ⭐⭐ 较大                                                   | ⭐⭐⭐ 中等       |
| Serverless 支持 | ⭐⭐⭐⭐⭐ 优秀           | ⭐⭐ 需要额外配置                                           | ⭐⭐⭐ 一般       |
| 类型安全        | ⭐⭐⭐⭐⭐ 完全类型安全   | ⭐⭐⭐⭐⭐ 完全类型安全                                     | ⭐⭐⭐⭐ 良好     |
| SQL 控制        | ⭐⭐⭐⭐⭐ 接近原生 SQL   | ⭐⭐⭐ 抽象层较高                                           | ⭐⭐⭐⭐ 灵活     |
| 学习曲线        | ⭐⭐⭐⭐ 熟悉 SQL 即可    | ⭐⭐⭐ 需要学习 DSL                                         | ⭐⭐⭐ 中等       |
| 迁移工具        | ⭐⭐⭐⭐ 优秀             | ⭐⭐⭐⭐⭐ 卓越                                             | ⭐⭐⭐ 一般       |
| 数据库支持      | PostgreSQL, MySQL, SQLite | PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, CockroachDB | 支持更多数据库    |
| 社区活跃度      | ⭐⭐⭐⭐ 快速增长         | ⭐⭐⭐⭐⭐ 非常活跃                                         | ⭐⭐⭐⭐ 成熟稳定 |

**选择理由**

1. **性能优势**: Drizzle ORM 是 2025 年性能最佳的 TypeScript ORM，在运行时开销最小
2. **Serverless 友好**: 无二进制依赖，启动速度快，非常适合 Vercel/Cloudflare 等 Serverless 环境
3. **Bundle 大小**: 基于 ESM、支持 Tree-shaking，打包体积最小
4. **SQL 透明度**: "If you know SQL, you know Drizzle" - 对于需要复杂查询的场景更灵活
5. **代码优先**: 直接在 TypeScript 中定义 schema，无需额外的 schema 文件
6. **类型安全**: 完全的 TypeScript 类型推导

**替代方案**: 如果团队更熟悉 Prisma 或需要更强大的迁移工具和更广泛的数据库支持，可以选择 Prisma。

#### 2.2.2 Redis 客户端选择: ioredis

**对比分析**

| 特性          | ioredis                  | node-redis          |
| ------------- | ------------------------ | ------------------- |
| 性能          | ⭐⭐⭐⭐⭐ 优秀          | ⭐⭐⭐⭐ 良好       |
| Cluster 支持  | ⭐⭐⭐⭐⭐ 内置完整支持  | ⭐⭐⭐⭐ 支持       |
| Sentinel 支持 | ⭐⭐⭐⭐⭐ 内置支持      | ⭐⭐⭐⭐ 支持       |
| Pipeline 优化 | ⭐⭐⭐⭐⭐ 自动 Pipeline | ⭐⭐⭐ 手动         |
| 周下载量      | 7,958,289                | 5,513,391           |
| GitHub Stars  | 14,987                   | 17,308              |
| 维护状态      | ⭐⭐⭐⭐⭐ 活跃          | ⭐⭐⭐⭐⭐ 活跃     |
| Redis 8 支持  | ⭐⭐⭐⭐ 良好            | ⭐⭐⭐⭐⭐ 优先支持 |
| API 成熟度    | ⭐⭐⭐⭐⭐ 非常成熟      | ⭐⭐⭐⭐ 现代化     |

**选择理由**

1. **企业级验证**: 被阿里巴巴等大型企业广泛使用，稳定性经过验证
2. **Cluster 支持**: 内置完善的 Cluster 和 Sentinel 支持，为未来扩展做准备
3. **性能优化**: 自动 Pipeline 功能可以显著减少网络往返次数
4. **批量操作优化**: 在批量操作时性能更好，因为会合并缓冲区后再发送
5. **成熟稳定**: API 更加成熟，文档丰富，社区支持好

**替代方案**: 如果需要 Redis 8 和 Redis Stack 的最新特性，可以选择 node-redis (官方推荐)。

#### 2.2.3 认证方案选择: NextAuth.js (Auth.js v5)

**对比分析**

| 特性            | NextAuth.js v5        | Clerk               | Lucia Auth                   |
| --------------- | --------------------- | ------------------- | ---------------------------- |
| 成本            | ⭐⭐⭐⭐⭐ 免费开源   | ⭐⭐ 付费 SaaS      | ⭐⭐⭐⭐⭐ 免费开源 (已废弃) |
| 灵活性          | ⭐⭐⭐⭐⭐ 完全可定制 | ⭐⭐⭐ 受限于平台   | ⭐⭐⭐⭐⭐ 完全可定制        |
| 设置时间        | ⭐⭐⭐ 1-2 小时       | ⭐⭐⭐⭐⭐ 30 分钟  | ⭐⭐⭐ 需要较多配置          |
| DX (开发体验)   | ⭐⭐⭐⭐ 良好         | ⭐⭐⭐⭐⭐ 优秀     | ⭐⭐⭐ 一般                  |
| App Router 支持 | ⭐⭐⭐⭐⭐ 完整支持   | ⭐⭐⭐⭐⭐ 完整支持 | ⭐⭐⭐ 一般                  |
| 数据所有权      | ⭐⭐⭐⭐⭐ 完全控制   | ⭐⭐ 托管在 Clerk   | ⭐⭐⭐⭐⭐ 完全控制          |
| Provider 支持   | ⭐⭐⭐⭐⭐ 80+        | ⭐⭐⭐⭐ 20+        | ⭐⭐⭐ 需自行实现            |
| 供应商锁定      | ⭐⭐⭐⭐⭐ 无         | ⭐⭐ 强锁定         | ⭐⭐⭐⭐⭐ 无                |
| 社区支持        | ⭐⭐⭐⭐⭐ 非常活跃   | ⭐⭐⭐⭐ 活跃       | ⭐ 已停止维护                |

**重要说明**: Lucia Auth 已于 2025年3月宣布停止维护，不再适用于生产环境。

**选择理由**

1. **零供应商锁定**: 完全开源，代码和数据完全自主控制
2. **成本效益**: 无需支付 SaaS 费用，适合长期运营
3. **灵活性**: 可以完全定制认证流程、数据库结构和会话管理
4. **Next.js 原生集成**: 与 Next.js 15 App Router 无缝集成
5. **丰富的 Provider**: 支持 80+ OAuth 提供商，满足各种需求
6. **数据主权**: 用户数据存储在自己的数据库中
7. **社区成熟**: 文档完善，社区活跃，问题容易解决

**替代方案**: 如果追求极致的开发速度和用户体验，且预算充足，可以选择 Clerk。

#### 2.2.4 为什么选择 Next.js 全栈开发

1. **统一技术栈**: 前后端使用同一语言和框架，降低认知负担
2. **Server Components**: 减少客户端 JavaScript，提升性能
3. **Server Actions**: 简化表单处理和数据变更
4. **API Routes**: 内置 API 路由，无需单独的后端服务器
5. **类型安全**: TypeScript 端到端类型安全
6. **优秀的 DX**: 热重载、快速刷新、优秀的开发体验
7. **部署简单**: 可以部署到 Vercel、Cloudflare 等多种平台

#### 2.2.5 为什么选择 shadcn/ui + Tailwind CSS

1. **非传统组件库**: 直接复制组件代码到项目中，完全可定制
2. **基于 Radix UI**: 优秀的无障碍访问和键盘导航支持
3. **Tailwind CSS 集成**: 实用优先的 CSS 方法，快速开发
4. **类型安全**: 完整的 TypeScript 支持
5. **现代设计**: 符合现代设计趋势的组件样式
6. **零运行时**: 没有额外的运行时开销
7. **主题系统**: 内置暗色模式和主题定制支持

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端请求                            │
│                    (使用分组 API Key)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes 层                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. API Key 验证中间件                                │   │
│  │  2. 请求速率限制 (Redis)                              │   │
│  │  3. 请求日志记录                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    轮询调度层                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 获取分组下的所有可用端点                          │   │
│  │  2. Redis 查询端点健康状态和权重                      │   │
│  │  3. 执行智能轮询算法选择端点                          │   │
│  │  4. 处理故障转移和重试                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    上游 API 调用                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 使用提供商的 API Key 调用上游接口                 │   │
│  │  2. 监控响应时间和成功率                              │   │
│  │  3. 更新 Redis 中的端点状态                           │   │
│  │  4. 返回结果给客户端                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    管理后台 (Next.js App)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. 提供商管理 (CRUD)                                 │   │
│  │  2. 分组管理 (CRUD)                                   │   │
│  │  3. API Key 管理                                      │   │
│  │  4. 实时监控和统计                                    │   │
│  │  5. 配置管理                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                               │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │   PostgreSQL    │  │          Redis                  │   │
│  │   (Drizzle ORM) │  │  - 端点健康状态                  │   │
│  │   - 提供商信息   │  │  - 轮询权重和统计                │   │
│  │   - 分组配置     │  │  - 请求速率限制                  │   │
│  │   - API Keys    │  │  - 性能指标缓存                  │   │
│  │   - 用户管理     │  │  - 会话存储                      │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据库设计

#### 3.2.1 数据库表结构 (Drizzle Schema)

```typescript
// schema/providers.ts
import { pgTable, serial, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'

export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  website: text('website'), // 可选
  apiUrl: text('api_url').notNull(), // 被代理的地址
  apiKey: text('api_key').notNull(), // 请求这个地址需要的 key
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// schema/groups.ts
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  apiKey: text('api_key').unique(), // 这个分组的专用 API Key
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// schema/group-providers.ts
import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core'

export const groupProviders = pgTable('group_providers', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull().default(0), // 优先级，用于权重计算
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// schema/api-keys.ts
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isGlobal: boolean('is_global').notNull().default(false), // 是否是全局 key
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
})

// schema/users.ts - NextAuth 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  password: text('password'), // 哈希后的密码
  role: varchar('role', { length: 50 }).notNull().default('user'), // admin, user
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// schema/request-logs.ts - 请求日志表
export const requestLogs = pgTable('request_logs', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => groups.id),
  providerId: integer('provider_id').references(() => providers.id),
  apiKeyId: integer('api_key_id').references(() => apiKeys.id),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'), // 毫秒
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

#### 3.2.2 Redis 数据结构设计

```typescript
// Redis Key 命名规范和数据结构

// 1. 端点健康状态
// Key: endpoint:health:{providerId}
// Type: Hash
// Fields:
//   - status: 'healthy' | 'degraded' | 'unhealthy'
//   - failureCount: number
//   - lastCheck: timestamp
//   - lastSuccess: timestamp
//   - lastFailure: timestamp
//   - avgResponseTime: number (ms)
//   - successRate: number (0-100)
// TTL: 300 seconds (5 minutes)

// 2. 轮询权重
// Key: polling:weight:{groupId}:{providerId}
// Type: String (number)
// Value: 动态权重分数 (0-100)
// TTL: 60 seconds

// 3. 请求速率限制
// Key: ratelimit:{apiKeyId}:{window}
// Type: String (number)
// Value: 当前窗口内的请求数
// TTL: 根据窗口大小设置

// 4. 分组端点列表缓存
// Key: group:endpoints:{groupId}
// Type: List
// Value: JSON.stringify({ providerId, name, url, priority })
// TTL: 300 seconds

// 5. 性能统计聚合
// Key: stats:provider:{providerId}:{date}
// Type: Hash
// Fields:
//   - totalRequests: number
//   - successfulRequests: number
//   - failedRequests: number
//   - totalResponseTime: number
//   - p50ResponseTime: number
//   - p95ResponseTime: number
//   - p99ResponseTime: number
// TTL: 7 days

// 6. 分布式锁
// Key: lock:endpoint:{providerId}
// Type: String
// Value: 锁持有者标识
// TTL: 10 seconds
```

---

## 4. 核心功能设计

### 4.1 智能轮询算法

#### 4.1.1 算法设计思路

系统采用**加权轮询 + 健康检查 + 自适应调整**的混合算法：

```typescript
// 轮询算法伪代码

interface EndpointHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  failureCount: number
  avgResponseTime: number
  successRate: number // 0-100
  weight: number // 动态权重 0-100
}

async function selectEndpoint(groupId: string): Promise<Provider> {
  // 1. 从缓存获取分组下的所有端点
  const endpoints = await getGroupEndpoints(groupId)

  // 2. 过滤掉不健康的端点
  const healthyEndpoints = endpoints.filter(async (ep) => {
    const health = await redis.hgetall(`endpoint:health:${ep.id}`)
    return health.status !== 'unhealthy'
  })

  if (healthyEndpoints.length === 0) {
    // 所有端点都不健康，触发告警并返回最后一次成功的端点
    throw new Error('No healthy endpoints available')
  }

  // 3. 计算每个端点的动态权重
  const weightedEndpoints = await Promise.all(
    healthyEndpoints.map(async (ep) => {
      const health = await redis.hgetall(`endpoint:health:${ep.id}`)

      // 基础权重 (配置的优先级)
      const baseWeight = ep.priority || 50

      // 健康状态加成
      const healthBonus = health.status === 'healthy' ? 20 : health.status === 'degraded' ? 10 : 0

      // 成功率加成 (0-20)
      const successBonus = (health.successRate / 100) * 20

      // 响应时间惩罚 (响应时间越长，惩罚越大)
      const responseTimePenalty = Math.min(health.avgResponseTime / 100, 30)

      // 失败次数惩罚
      const failurePenalty = Math.min(health.failureCount * 5, 40)

      // 最终权重
      const finalWeight = Math.max(
        baseWeight + healthBonus + successBonus - responseTimePenalty - failurePenalty,
        1 // 最小权重为 1
      )

      return { ...ep, calculatedWeight: finalWeight }
    })
  )

  // 4. 使用加权随机选择
  const totalWeight = weightedEndpoints.reduce((sum, ep) => sum + ep.calculatedWeight, 0)
  let random = Math.random() * totalWeight

  for (const endpoint of weightedEndpoints) {
    random -= endpoint.calculatedWeight
    if (random <= 0) {
      return endpoint
    }
  }

  // 兜底：返回权重最高的
  return weightedEndpoints.sort((a, b) => b.calculatedWeight - a.calculatedWeight)[0]
}
```

#### 4.1.2 健康检查机制

```typescript
// 被动健康检查：根据实际请求结果更新健康状态

async function updateEndpointHealth(
  providerId: string,
  success: boolean,
  responseTime: number,
  error?: Error
) {
  const key = `endpoint:health:${providerId}`
  const health = (await redis.hgetall(key)) || {}

  const now = Date.now()
  const failureCount = parseInt(health.failureCount || '0')
  const successRate = parseFloat(health.successRate || '100')
  const avgResponseTime = parseFloat(health.avgResponseTime || '0')

  if (success) {
    // 成功请求：降低失败计数，更新成功率和响应时间
    const newFailureCount = Math.max(failureCount - 1, 0)
    const newSuccessRate = Math.min(successRate + 2, 100) // 逐步恢复
    const newAvgResponseTime =
      avgResponseTime === 0 ? responseTime : avgResponseTime * 0.9 + responseTime * 0.1 // 指数移动平均

    await redis.hset(key, {
      status: newFailureCount === 0 ? 'healthy' : 'degraded',
      failureCount: newFailureCount,
      lastCheck: now,
      lastSuccess: now,
      avgResponseTime: newAvgResponseTime,
      successRate: newSuccessRate,
    })
  } else {
    // 失败请求：增加失败计数，降低成功率
    const newFailureCount = failureCount + 1
    const newSuccessRate = Math.max(successRate - 5, 0)

    let newStatus = 'healthy'
    if (newFailureCount >= 5) {
      newStatus = 'unhealthy'
    } else if (newFailureCount >= 2 || newSuccessRate < 80) {
      newStatus = 'degraded'
    }

    await redis.hset(key, {
      status: newStatus,
      failureCount: newFailureCount,
      lastCheck: now,
      lastFailure: now,
      avgResponseTime: avgResponseTime,
      successRate: newSuccessRate,
      errorMessage: error?.message || 'Unknown error',
    })
  }

  // 设置 TTL
  await redis.expire(key, 300)
}

// 主动健康检查：定期 ping 端点（可选功能，使用 cron job 实现）

async function activeHealthCheck(providerId: string, apiUrl: string) {
  try {
    const start = Date.now()
    const response = await fetch(`${apiUrl}/health`, {
      // 假设端点有健康检查接口
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5秒超时
    })
    const responseTime = Date.now() - start

    await updateEndpointHealth(
      providerId,
      response.ok,
      responseTime,
      response.ok ? undefined : new Error(`HTTP ${response.status}`)
    )
  } catch (error) {
    await updateEndpointHealth(providerId, false, 0, error as Error)
  }
}
```

#### 4.1.3 故障转移和重试机制

```typescript
// 请求代理核心逻辑

async function proxyRequest(
  groupId: string,
  requestData: any,
  apiKeyId: string,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null
  let attemptCount = 0
  const failedProviders = new Set<string>()

  while (attemptCount < maxRetries) {
    attemptCount++

    try {
      // 选择端点（排除已失败的）
      const endpoint = await selectEndpoint(groupId, failedProviders)

      // 记录请求开始时间
      const startTime = Date.now()

      // 发起上游请求
      const response = await fetch(endpoint.apiUrl, {
        method: requestData.method,
        headers: {
          ...requestData.headers,
          Authorization: `Bearer ${endpoint.apiKey}`, // 使用提供商的 API Key
          'Content-Type': 'application/json',
        },
        body: requestData.body ? JSON.stringify(requestData.body) : undefined,
        signal: AbortSignal.timeout(30000), // 30秒超时
      })

      const responseTime = Date.now() - startTime

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 成功：更新健康状态
      await updateEndpointHealth(endpoint.id, true, responseTime)

      // 记录成功日志
      await logRequest({
        groupId,
        providerId: endpoint.id,
        apiKeyId,
        statusCode: response.status,
        responseTime,
        success: true,
      })

      // 返回响应
      return response
    } catch (error) {
      lastError = error as Error

      // 记录失败的 provider
      const currentEndpoint = await selectEndpoint(groupId, failedProviders)
      failedProviders.add(currentEndpoint.id)

      // 更新健康状态
      await updateEndpointHealth(currentEndpoint.id, false, 0, error as Error)

      // 记录失败日志
      await logRequest({
        groupId,
        providerId: currentEndpoint.id,
        apiKeyId,
        statusCode: 0,
        responseTime: 0,
        success: false,
        errorMessage: error.message,
      })

      // 如果所有端点都失败了，或达到最大重试次数，抛出错误
      const availableEndpoints = await getGroupEndpoints(groupId)
      if (failedProviders.size >= availableEndpoints.length || attemptCount >= maxRetries) {
        throw new Error(
          `All endpoints failed or max retries reached. Last error: ${lastError.message}`
        )
      }

      // 等待一段时间后重试（指数退避）
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(100 * Math.pow(2, attemptCount), 2000))
      )
    }
  }

  throw lastError || new Error('Unknown error occurred')
}
```

### 4.2 API 鉴权系统

#### 4.2.1 三层 API Key 架构

```typescript
// API Key 优先级：
// 1. 分组专用 API Key (最高优先级)
// 2. 全局 API Key
// 3. 无 Key 访问（可配置是否允许）

async function validateApiKey(
  requestApiKey: string,
  groupId?: string
): Promise<{ valid: boolean; apiKeyId?: string; groupId?: string }> {
  if (!requestApiKey) {
    // 检查是否允许无 Key 访问
    const allowAnonymous = await getSystemConfig('allowAnonymousAccess')
    if (!allowAnonymous) {
      return { valid: false }
    }
    return { valid: true } // 匿名访问
  }

  // 查询数据库验证 API Key
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.key, requestApiKey),
  })

  if (!apiKey || !apiKey.isActive) {
    return { valid: false }
  }

  // 更新最后使用时间
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id))

  // 如果是全局 Key，可以访问所有分组
  if (apiKey.isGlobal) {
    return {
      valid: true,
      apiKeyId: apiKey.id,
      groupId: groupId, // 使用请求中指定的 groupId
    }
  }

  // 如果是分组专用 Key，验证是否匹配
  const group = await db.query.groups.findFirst({
    where: eq(groups.apiKey, requestApiKey),
  })

  if (group && group.isActive) {
    return {
      valid: true,
      apiKeyId: apiKey.id,
      groupId: group.id,
    }
  }

  return { valid: false }
}
```

#### 4.2.2 请求速率限制

```typescript
// 基于 Redis 的滑动窗口速率限制

interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
}

async function checkRateLimit(
  apiKeyId: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `ratelimit:${apiKeyId}:${Math.floor(now / config.windowMs)}`

  // 使用 Redis 事务确保原子性
  const multi = redis.multi()
  multi.incr(key)
  multi.pexpire(key, config.windowMs)
  const results = await multi.exec()

  const currentCount = results[0][1] as number
  const allowed = currentCount <= config.maxRequests
  const remaining = Math.max(config.maxRequests - currentCount, 0)
  const resetTime = Math.floor(now / config.windowMs + 1) * config.windowMs

  return {
    allowed,
    remaining,
    resetTime,
  }
}

// Next.js Middleware 中应用速率限制

export async function middleware(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey) {
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (validation.apiKeyId) {
      const rateLimit = await checkRateLimit(validation.apiKeyId)

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            resetTime: rateLimit.resetTime,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            },
          }
        )
      }

      // 将验证信息添加到请求头，供后续处理使用
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-api-key-id', validation.apiKeyId)
      requestHeaders.set('x-group-id', validation.groupId || '')
      requestHeaders.set('x-ratelimit-remaining', rateLimit.remaining.toString())

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/proxy/:path*',
}
```

### 4.3 管理后台功能

#### 4.3.1 提供商管理

**功能列表**:

- 新增提供商（名称、官网、API 地址、API Key）
- 编辑提供商信息
- 启用/禁用提供商
- 删除提供商（级联删除关联的分组关系）
- 查看提供商统计数据（请求数、成功率、平均响应时间）
- 批量导入/导出提供商配置（JSON/CSV 格式）

**UI 组件**:

- 使用 shadcn/ui 的 `DataTable` 组件展示提供商列表
- `Dialog` 组件用于新增/编辑表单
- `AlertDialog` 组件用于删除确认
- `Badge` 组件显示状态（健康/降级/不健康）
- `Chart` 组件（使用 Recharts）展示性能趋势

**示例代码**:

```typescript
// app/admin/providers/page.tsx

'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProviderForm } from '@/components/providers/provider-form'
import { columns } from './columns'

export default function ProvidersPage() {
  const [providers, setProviders] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 使用 Server Actions 或 API Routes 获取数据
  // const { data: providers } = useSWR('/api/admin/providers', fetcher)

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API 提供商管理</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          新增提供商
        </Button>
      </div>

      <DataTable columns={columns} data={providers} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增提供商</DialogTitle>
          </DialogHeader>
          <ProviderForm onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

#### 4.3.2 分组管理

**功能列表**:

- 创建分组（名称、描述）
- 为分组生成专用 API Key
- 管理分组下的提供商（添加/移除，设置优先级）
- 启用/禁用分组
- 查看分组统计数据
- 拖拽排序调整提供商优先级

**UI 特性**:

- 使用 `dnd-kit` 实现拖拽排序
- 使用 `Tabs` 组件切换分组详情、提供商、统计等视图
- 使用 `Select` 组件添加提供商到分组
- 使用 `Slider` 组件调整权重

#### 4.3.3 API Key 管理

**功能列表**:

- 生成新的 API Key（自动生成或自定义）
- 设置 Key 类型（全局 Key / 分组专用 Key）
- 启用/禁用 Key
- 删除 Key
- 查看 Key 使用统计
- 复制 Key 到剪贴板（带遮罩显示）

**安全措施**:

- 使用 `crypto.randomBytes` 生成高强度 Key
- 显示时部分遮罩（如：`sk_live_abc...xyz`）
- 记录最后使用时间
- 支持设置过期时间（可选）

#### 4.3.4 实时监控和统计

**功能模块**:

1. **仪表盘总览**
   - 总请求数（今日/本周/本月）
   - 平均响应时间
   - 总体成功率
   - 活跃提供商数量
   - 实时请求速率图表

2. **提供商健康监控**
   - 实时健康状态（健康/降级/不健康）
   - 各提供商请求分布饼图
   - 响应时间趋势折线图
   - P50/P95/P99 延迟统计

3. **告警系统**（可选）
   - 提供商不可用告警
   - 成功率低于阈值告警
   - 响应时间超标告警
   - 通知渠道：邮件、Webhook、钉钉/飞书

**技术实现**:

- 使用 Server-Sent Events (SSE) 或 WebSocket 实现实时数据推送
- 使用 Recharts 或 Chart.js 渲染图表
- 使用 React Query 进行数据缓存和自动刷新

---

## 5. API 接口设计

### 5.1 代理接口

#### 5.1.1 通用代理端点

```typescript
// POST /api/proxy/{groupName}
// 描述：代理请求到指定分组的某个提供商

// Request Headers:
// X-API-Key: string (必填，除非允许匿名访问)
// Content-Type: application/json

// Request Body: (透传给上游 API)
{
  // 任意 JSON 数据，直接转发给上游提供商
}

// Response:
// 成功时：返回上游 API 的原始响应（透传）
// 失败时：
{
  "error": "string",
  "message": "string",
  "retryable": boolean,
  "details": {
    "attemptCount": number,
    "lastError": "string"
  }
}

// Response Headers:
// X-Provider-Id: string (实际处理请求的提供商 ID)
// X-Response-Time: number (毫秒)
// X-RateLimit-Remaining: number
// X-RateLimit-Reset: timestamp
```

**实现示例**:

```typescript
// app/api/proxy/[group]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { proxyRequest } from '@/lib/proxy'
import { validateApiKey } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { group: string } }) {
  try {
    // 1. 验证 API Key
    const apiKey = request.headers.get('x-api-key')
    const validation = await validateApiKey(apiKey, params.group)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    // 2. 获取分组 ID
    const groupId = validation.groupId || (await getGroupIdByName(params.group))

    if (!groupId) {
      return NextResponse.json(
        { error: 'Not Found', message: `Group '${params.group}' not found` },
        { status: 404 }
      )
    }

    // 3. 解析请求体
    const requestData = await request.json()

    // 4. 执行代理请求
    const startTime = Date.now()
    const response = await proxyRequest(groupId, requestData, validation.apiKeyId)
    const responseTime = Date.now() - startTime

    // 5. 解析上游响应
    const responseData = await response.json()

    // 6. 返回响应，附加元数据
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'X-Provider-Id': response.headers.get('X-Provider-Id') || 'unknown',
        'X-Response-Time': responseTime.toString(),
        'X-RateLimit-Remaining': request.headers.get('x-ratelimit-remaining') || '0',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message,
        retryable: error.retryable || false,
      },
      { status: 500 }
    )
  }
}

// 支持其他 HTTP 方法
export async function GET(request: NextRequest, { params }: { params: { group: string } }) {
  // 类似实现
}

export async function PUT(request: NextRequest, { params }: { params: { group: string } }) {
  // 类似实现
}

export async function DELETE(request: NextRequest, { params }: { params: { group: string } }) {
  // 类似实现
}
```

### 5.2 管理后台 API

#### 5.2.1 提供商管理 API

```typescript
// GET /api/admin/providers
// 描述：获取所有提供商列表

// Response:
{
  "providers": [
    {
      "id": number,
      "name": string,
      "website": string | null,
      "apiUrl": string,
      "apiKey": string, // 部分遮罩显示
      "isActive": boolean,
      "health": {
        "status": "healthy" | "degraded" | "unhealthy",
        "successRate": number,
        "avgResponseTime": number
      },
      "createdAt": string,
      "updatedAt": string
    }
  ]
}

// POST /api/admin/providers
// 描述：创建新提供商

// Request Body:
{
  "name": string,
  "website": string | null,
  "apiUrl": string,
  "apiKey": string,
  "isActive": boolean
}

// Response: 创建成功的提供商对象

// PUT /api/admin/providers/{id}
// 描述：更新提供商信息

// PATCH /api/admin/providers/{id}/toggle
// 描述：切换提供商启用状态

// DELETE /api/admin/providers/{id}
// 描述：删除提供商
```

#### 5.2.2 分组管理 API

```typescript
// GET /api/admin/groups
// 描述：获取所有分组列表

// POST /api/admin/groups
// 描述：创建新分组

// Request Body:
{
  "name": string,
  "description": string | null,
  "generateApiKey": boolean // 是否自动生成 API Key
}

// POST /api/admin/groups/{id}/providers
// 描述：添加提供商到分组

// Request Body:
{
  "providerId": number,
  "priority": number
}

// DELETE /api/admin/groups/{id}/providers/{providerId}
// 描述：从分组中移除提供商

// PUT /api/admin/groups/{id}/providers/order
// 描述：调整分组内提供商的优先级

// Request Body:
{
  "providers": [
    { "providerId": number, "priority": number }
  ]
}
```

#### 5.2.3 统计和监控 API

```typescript
// GET /api/admin/stats/overview
// 描述：获取总体统计数据

// Query Parameters:
// - period: 'today' | 'week' | 'month'

// Response:
{
  "totalRequests": number,
  "successfulRequests": number,
  "failedRequests": number,
  "successRate": number,
  "avgResponseTime": number,
  "activeProviders": number,
  "activeGroups": number,
  "topProviders": [
    {
      "id": number,
      "name": string,
      "requestCount": number,
      "successRate": number
    }
  ]
}

// GET /api/admin/stats/providers/{id}
// 描述：获取单个提供商的详细统计

// Response:
{
  "providerId": number,
  "stats": {
    "totalRequests": number,
    "successfulRequests": number,
    "failedRequests": number,
    "successRate": number,
    "avgResponseTime": number,
    "p50ResponseTime": number,
    "p95ResponseTime": number,
    "p99ResponseTime": number
  },
  "timeline": [
    {
      "timestamp": string,
      "requests": number,
      "avgResponseTime": number
    }
  ]
}

// GET /api/admin/health
// 描述：获取所有提供商的实时健康状态

// Response:
{
  "providers": [
    {
      "id": number,
      "name": string,
      "status": "healthy" | "degraded" | "unhealthy",
      "failureCount": number,
      "lastCheck": string,
      "lastSuccess": string | null,
      "lastFailure": string | null,
      "avgResponseTime": number,
      "successRate": number
    }
  ]
}
```

---

## 6. 部署和运维

### 6.1 推荐部署方案

#### 6.1.1 Vercel 部署（推荐用于小型到中型项目）

**优势**:

- 零配置部署，与 Next.js 深度集成
- 自动 HTTPS、全球 CDN
- Serverless Functions 自动扩展
- 内置预览环境
- 免费额度适合初期使用

**环境变量配置**:

```bash
# .env.production
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://user:password@host:6379
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

**部署步骤**:

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 推送代码自动触发部署
4. 配置自定义域名（可选）

**注意事项**:

- Vercel Serverless Functions 有 10 秒执行时间限制（Pro 版为 60 秒）
- 需要使用连接池管理数据库连接（推荐 Supabase Pooler 或 PgBouncer）

#### 6.1.2 自托管部署（推荐用于大型项目或需要完全控制）

**技术栈**:

- Docker + Docker Compose
- Nginx 作为反向代理
- PM2 进程管理器
- PostgreSQL + Redis 容器

**Docker Compose 示例**:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/api_proxy
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=api_proxy
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Dockerfile**:

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# 生产运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

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

### 6.2 监控和日志

#### 6.2.1 日志收集

**推荐方案**:

- 使用 Pino 或 Winston 作为日志库
- 结构化日志输出（JSON 格式）
- 日志级别：DEBUG, INFO, WARN, ERROR
- 集成 Sentry 用于错误追踪

**日志内容**:

- API 请求和响应（包含请求 ID）
- 提供商选择和轮询决策
- 健康检查结果
- 错误和异常堆栈
- 性能指标（响应时间、数据库查询时间）

#### 6.2.2 性能监控

**推荐工具**:

- **Vercel Analytics**: 部署在 Vercel 时自动启用
- **New Relic / Datadog**: 企业级 APM 工具
- **Prometheus + Grafana**: 开源监控方案
- **Uptime Robot**: 外部可用性监控

**关键指标**:

- 请求成功率
- P50/P95/P99 响应时间
- 提供商可用性
- Redis 缓存命中率
- 数据库连接池使用率
- CPU 和内存使用率

### 6.3 数据库迁移

**Drizzle 迁移流程**:

```bash
# 1. 生成迁移文件
pnpm drizzle-kit generate:pg

# 2. 应用迁移
pnpm drizzle-kit push:pg

# 3. 查看迁移历史
pnpm drizzle-kit studio
```

**生产环境迁移最佳实践**:

1. 在 staging 环境先测试迁移
2. 备份生产数据库
3. 使用事务执行迁移
4. 监控迁移执行时间
5. 准备回滚计划

### 6.4 备份策略

**数据库备份**:

- 每日全量备份
- 每小时增量备份（使用 WAL 归档）
- 保留 30 天备份
- 定期测试恢复流程

**Redis 备份**:

- 启用 AOF（Append Only File）持久化
- 每日 RDB 快照
- 备份到对象存储（S3/OSS）

---

## 7. 安全考虑

### 7.1 API 安全

1. **API Key 安全**
   - 使用高强度随机生成器生成 Key
   - 支持 Key 轮换（Rotation）
   - 记录 Key 使用审计日志
   - 支持 IP 白名单（可选）

2. **请求验证**
   - 请求体大小限制（防止 DoS）
   - 请求频率限制（Rate Limiting）
   - CORS 配置
   - CSRF 保护（管理后台）

3. **数据加密**
   - HTTPS 强制传输加密
   - 敏感数据（API Key）数据库加密存储
   - 环境变量使用密钥管理服务（如 AWS Secrets Manager）

### 7.2 管理后台安全

1. **认证和授权**
   - 强密码策略
   - 多因素认证（MFA，可选）
   - 基于角色的访问控制（RBAC）
   - 会话超时和自动登出

2. **审计日志**
   - 记录所有管理操作
   - 登录/登出日志
   - 配置变更历史
   - 导出审计报告

3. **安全头**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security (HSTS)

---

## 8. 性能优化

### 8.1 缓存策略

1. **端点列表缓存**
   - 缓存分组的端点列表（5 分钟）
   - 使用 Redis 存储
   - 配置变更时主动失效

2. **健康状态缓存**
   - 缓存端点健康状态（5 分钟）
   - 被动更新：每次请求后更新
   - 主动更新：定时健康检查（可选）

3. **统计数据缓存**
   - 聚合统计数据缓存（15 分钟）
   - 使用 Stale-While-Revalidate 模式
   - 后台异步更新

### 8.2 数据库优化

1. **索引优化**
   - 在常用查询字段上建立索引
   - 复合索引优化 JOIN 查询
   - 定期分析查询性能（EXPLAIN）

2. **连接池配置**
   - 使用 Drizzle 内置连接池
   - 合理设置 pool size（推荐 10-20）
   - 配置连接超时和空闲超时

3. **查询优化**
   - 避免 N+1 查询
   - 使用 SELECT 指定字段，避免 SELECT \*
   - 对大数据量查询使用分页

### 8.3 Redis 优化

1. **内存优化**
   - 设置合理的 TTL，避免内存溢出
   - 使用 Hash 数据结构减少内存占用
   - 定期监控内存使用率

2. **性能优化**
   - 使用 Pipeline 批量操作
   - 避免大 Key 操作
   - 使用 Redis Cluster（大规模场景）

---

## 9. 开发路线图

### 9.1 第一阶段：MVP（最小可行产品）

**时间**: 2-3 周

**功能**:

- ✅ 基础项目搭建（Next.js + Drizzle + Redis）
- ✅ 数据库 Schema 设计和迁移
- ✅ 提供商管理 CRUD 功能
- ✅ 基础轮询算法（加权随机）
- ✅ API 代理核心功能
- ✅ 简单的管理后台 UI
- ✅ 基础认证（用户名密码登录）

### 9.2 第二阶段：核心功能完善

**时间**: 2-3 周

**功能**:

- ✅ 分组管理功能
- ✅ API Key 生成和管理
- ✅ 健康检查机制
- ✅ 故障转移和重试逻辑
- ✅ 请求日志和基础统计
- ✅ 请求速率限制
- ✅ 提供商优先级配置

### 9.3 第三阶段：监控和优化

**时间**: 2 周

**功能**:

- ✅ 实时监控仪表盘
- ✅ 详细的统计图表
- ✅ 性能优化（缓存、数据库索引）
- ✅ 错误追踪（Sentry 集成）
- ✅ 日志系统完善
- ✅ 告警系统（可选）

### 9.4 第四阶段：高级功能

**时间**: 2-3 周

**功能**:

- ⬜ 主动健康检查（定时任务）
- ⬜ 多种轮询策略（轮询、最少连接、IP Hash 等）
- ⬜ WebSocket 支持（实时推送）
- ⬜ 请求重放和调试工具
- ⬜ API 文档自动生成
- ⬜ 批量配置导入/导出
- ⬜ Webhook 通知
- ⬜ 多租户支持（可选）

---

## 10. 附录

### 10.1 环境变量配置参考

```bash
# .env.example

# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/api_proxy"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# NextAuth 配置
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
NODE_ENV="development"
APP_NAME="API Proxy System"
APP_URL="http://localhost:3000"

# 速率限制配置
RATE_LIMIT_WINDOW_MS="60000" # 1 分钟
RATE_LIMIT_MAX_REQUESTS="100"

# 日志配置
LOG_LEVEL="info" # debug, info, warn, error
SENTRY_DSN="" # Sentry 错误追踪（可选）

# 功能开关
ALLOW_ANONYMOUS_ACCESS="false"
ENABLE_ACTIVE_HEALTH_CHECK="true"
HEALTH_CHECK_INTERVAL_MS="60000" # 1 分钟

# 轮询配置
MAX_RETRY_ATTEMPTS="3"
REQUEST_TIMEOUT_MS="30000" # 30 秒
```

### 10.2 依赖包清单

```json
{
  "name": "api-proxy-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",

    "ioredis": "^5.7.0",

    "next-auth": "^5.0.0-beta.25",
    "bcrypt": "^5.1.1",

    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.462.0",

    "recharts": "^2.15.0",
    "date-fns": "^4.1.0",
    "zod": "^3.24.1",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^3.10.0",

    "swr": "^2.3.1",
    "pino": "^9.6.0",
    "pino-pretty": "^13.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.29.1",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.10"
  }
}
```

### 10.3 数据库迁移示例

```sql
-- 初始化数据库表结构

-- 提供商表
CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website TEXT,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_is_active ON providers(is_active);

-- 分组表
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  api_key TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_api_key ON groups(api_key);
CREATE INDEX idx_groups_is_active ON groups(is_active);

-- 分组-提供商关联表
CREATE TABLE group_providers (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, provider_id)
);

CREATE INDEX idx_group_providers_group_id ON group_providers(group_id);
CREATE INDEX idx_group_providers_provider_id ON group_providers(provider_id);

-- API Key 表
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified TIMESTAMP,
  image TEXT,
  password TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- 请求日志表
CREATE TABLE request_logs (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  provider_id INTEGER REFERENCES providers(id),
  api_key_id INTEGER REFERENCES api_keys(id),
  status_code INTEGER,
  response_time INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX idx_request_logs_provider_id ON request_logs(provider_id);
CREATE INDEX idx_request_logs_success ON request_logs(success);
```

### 10.4 Redis 键值设计参考

```typescript
// Redis 键值设计规范

// 1. 端点健康状态
// Key Pattern: endpoint:health:{providerId}
// Type: Hash
// Example:
redis.hset('endpoint:health:123', {
  status: 'healthy',
  failureCount: 0,
  lastCheck: Date.now(),
  lastSuccess: Date.now(),
  avgResponseTime: 150,
  successRate: 98.5,
})

// 2. 轮询权重缓存
// Key Pattern: polling:weight:{groupId}:{providerId}
// Type: String
redis.set('polling:weight:1:123', '85', 'EX', 60)

// 3. 速率限制
// Key Pattern: ratelimit:{apiKeyId}:{window}
// Type: String
const window = Math.floor(Date.now() / 60000) // 1分钟窗口
redis.incr(`ratelimit:456:${window}`)
redis.expire(`ratelimit:456:${window}`, 60)

// 4. 分组端点列表缓存
// Key Pattern: group:endpoints:{groupId}
// Type: String (JSON)
redis.set(
  'group:endpoints:1',
  JSON.stringify([
    { id: 123, name: 'Provider A', url: 'https://api-a.com', priority: 10 },
    { id: 456, name: 'Provider B', url: 'https://api-b.com', priority: 5 },
  ]),
  'EX',
  300
)

// 5. 统计数据聚合
// Key Pattern: stats:provider:{providerId}:{date}
// Type: Hash
const today = new Date().toISOString().split('T')[0]
redis.hincrby(`stats:provider:123:${today}`, 'totalRequests', 1)
redis.hincrby(`stats:provider:123:${today}`, 'successfulRequests', 1)
redis.expire(`stats:provider:123:${today}`, 604800) // 7天

// 6. 分布式锁
// Key Pattern: lock:endpoint:{providerId}
// Type: String
const lockId = crypto.randomUUID()
const acquired = await redis.set('lock:endpoint:123', lockId, 'NX', 'EX', 10)
```

---

## 11. 总结

本 PRD 文档详细描述了 API 代理轮询系统的设计和实现方案。系统采用现代化的技术栈（Next.js 15 + Drizzle ORM + ioredis + NextAuth.js），通过智能轮询算法、健康检查机制和多层缓存策略，实现了一个高可用、高性能的 API 聚合代理服务。

### 核心优势

1. **技术先进性**: 采用 2025 年最新、性能最优的技术栈
2. **类型安全**: 端到端 TypeScript 类型安全
3. **高可用性**: 智能故障转移和多层重试机制
4. **易于维护**: 代码清晰、文档完善、遵循最佳实践
5. **可扩展性**: 模块化设计，便于添加新功能
6. **成本效益**: 开源技术栈，无供应商锁定

### 下一步行动

1. 根据 PRD 创建详细的技术设计文档
2. 搭建开发环境和项目脚手架
3. 实现 MVP 核心功能
4. 编写单元测试和集成测试
5. 部署到 staging 环境进行测试
6. 收集反馈并迭代优化

---

**文档版本历史**:

- v1.0 (2025-10-17): 初始版本，完成所有章节
