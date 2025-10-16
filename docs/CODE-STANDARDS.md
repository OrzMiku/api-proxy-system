# API 代理轮询系统 - 代码规范文档

**版本**: 1.0
**日期**: 2025-10-17
**基于**: Next.js 15, TypeScript 5.7, Drizzle ORM, ioredis, NextAuth.js v5

---

## 目录

1. [核心开发原则](#1-核心开发原则)
2. [TypeScript 编码规范](#2-typescript-编码规范)
3. [Next.js 15 开发规范](#3-nextjs-15-开发规范)
4. [React 组件开发规范](#4-react-组件开发规范)
5. [Drizzle ORM 使用规范](#5-drizzle-orm-使用规范)
6. [Redis (ioredis) 使用规范](#6-redis-ioredis-使用规范)
7. [认证与安全规范](#7-认证与安全规范)
8. [代码质量工具配置](#8-代码质量工具配置)
9. [测试规范](#9-测试规范)
10. [Git 工作流规范](#10-git-工作流规范)
11. [文档规范](#11-文档规范)
12. [性能优化指南](#12-性能优化指南)

---

## 1. 核心开发原则

### 1.1 设计原则

#### SOLID 原则

- **单一职责原则 (SRP)**: 每个函数、类或模块只负责一个功能
- **开闭原则 (OCP)**: 对扩展开放，对修改关闭
- **里氏替换原则 (LSP)**: 子类应该能够替换父类
- **接口隔离原则 (ISP)**: 不应该强迫客户依赖它们不使用的接口
- **依赖倒置原则 (DIP)**: 依赖抽象而不是具体实现

#### 代码质量原则

1. **类型安全优先**: 充分利用 TypeScript 的类型系统，避免使用 `any`
2. **可读性优于简洁性**: 代码应该易于理解，必要时添加注释
3. **性能意识**: 关注性能但不过早优化
4. **安全第一**: 在每个层面考虑安全性
5. **可测试性**: 编写易于测试的代码

### 1.2 技术栈优势

本项目采用的技术栈具有以下优势：

- **Next.js 15**: 最新的 React 全栈框架，提供 Server Components、App Router 等现代化特性
- **TypeScript**: 端到端类型安全，减少运行时错误
- **Drizzle ORM**: 性能最优的 TypeScript ORM，Serverless 友好，Bundle 体积最小
- **ioredis**: 企业级验证的 Redis 客户端，支持 Cluster 和 auto-pipelining
- **NextAuth.js v5**: 零供应商锁定，完全可定制的开源认证方案
- **Airbnb ESLint**: React 生态系统的事实标准，规则完善

---

## 2. TypeScript 编码规范

### 2.1 类型定义规范

#### 2.1.1 基本原则

```typescript
// ✅ 好的做法：显式类型定义
interface User {
  id: number
  email: string
  name: string | null
  role: 'admin' | 'user'
  createdAt: Date
}

// ✅ 好的做法：使用类型推断（当类型明显时）
const count = 5 // TypeScript 可以推断为 number

// ❌ 避免使用 any
const data: any = fetchData() // 不好

// ✅ 使用 unknown 并进行类型守卫
const data: unknown = fetchData()
if (isValidData(data)) {
  // 现在可以安全使用 data
}
```

#### 2.1.2 接口 vs 类型别名

**优先使用接口 (interface)**，除非需要类型别名特有的功能：

```typescript
// ✅ 优先使用接口
interface Provider {
  id: number
  name: string
  apiUrl: string
}

// ✅ 接口可以扩展
interface ActiveProvider extends Provider {
  isActive: true
  healthStatus: HealthStatus
}

// ✅ 类型别名用于联合类型、交叉类型、原始类型别名
type Status = 'healthy' | 'degraded' | 'unhealthy'
type ID = string | number
type PartialProvider = Partial<Provider>
```

**原因**: 接口提供更好的错误信息，支持声明合并，性能略优于类型别名。

#### 2.1.3 严格的 null 检查

```typescript
// ✅ 明确处理 null 和 undefined
interface Config {
  apiKey: string
  timeout?: number // 可选属性
  retryCount: number | null // 显式允许 null
}

// ✅ 使用可选链和空值合并
const timeout = config.timeout ?? 30000
const lastUsed = apiKey.lastUsedAt?.toISOString()

// ❌ 避免非空断言（除非绝对确定）
const email = user.email! // 危险！

// ✅ 使用类型守卫
if (user.email) {
  sendEmail(user.email) // TypeScript 知道 email 不为 null
}
```

#### 2.1.4 泛型使用

```typescript
// ✅ 好的泛型使用
interface ApiResponse<T> {
  data: T
  statusCode: number
  message: string
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url)
  return response.json()
}

// 使用时类型安全
const result = await fetchData<Provider[]>('/api/providers')
// result.data 的类型是 Provider[]

// ✅ 泛型约束
interface HasId {
  id: number
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id)
}
```

### 2.2 命名约定

#### 2.2.1 通用命名规则

```typescript
// ✅ PascalCase: 类、接口、类型别名、枚举
class DatabaseConnection {}
interface UserProfile {}
type ApiKey = string
enum UserRole {
  Admin = 'admin',
  User = 'user',
}

// ✅ camelCase: 变量、函数、方法
const userName = 'John'
function fetchUserData() {}
const handleSubmit = () => {}

// ✅ UPPER_SNAKE_CASE: 常量
const MAX_RETRY_ATTEMPTS = 3
const API_BASE_URL = 'https://api.example.com'

// ✅ kebab-case: 文件名
// user-profile.tsx
// api-client.ts
// use-providers.ts
```

#### 2.2.2 布尔值命名

```typescript
// ✅ 使用 is/has/can/should 前缀
const isActive = true
const hasPermission = false
const canEdit = true
const shouldRetry = false

// ✅ 接口中的布尔属性
interface Provider {
  id: number
  name: string
  isActive: boolean
  hasHealthCheck: boolean
}
```

#### 2.2.3 函数命名

```typescript
// ✅ 动词开头，描述性强
function createProvider() {}
function updateHealthStatus() {}
function validateApiKey() {}
function checkRateLimit() {}

// ✅ 获取数据使用 get/fetch
async function getProviderById(id: number) {}
async function fetchGroupEndpoints(groupId: number) {}

// ✅ 布尔返回值使用 is/has/can/should
function isHealthy(provider: Provider): boolean {}
function hasValidApiKey(key: string): boolean {}
```

### 2.3 文件组织

#### 2.3.1 导入顺序

```typescript
// 1. Node.js 内置模块
import { readFile } from 'fs/promises'

// 2. 第三方库（按字母顺序）
import { eq, and, desc } from 'drizzle-orm'
import Redis from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'

// 3. 项目内部模块（按层级）
import { db } from '@/lib/db'
import { providers, groups } from '@/schema'
import { validateApiKey } from '@/lib/auth'
import type { Provider, HealthStatus } from '@/types'

// 4. 样式（如果有）
import styles from './styles.module.css'
```

#### 2.3.2 导出规范

```typescript
// ✅ 命名导出（推荐，便于重构）
export function calculateWeight() {}
export interface ProviderConfig {}

// ✅ 默认导出（仅用于 React 组件和 Next.js 页面）
export default function ProvidersPage() {
  return <div>Providers</div>
}

// ❌ 避免混合使用（在同一文件中）
export function helper() {} // 命名导出
export default Component // 默认导出 - 尽量避免在工具文件中这样做
```

### 2.4 类型断言与类型守卫

#### 2.4.1 类型守卫

```typescript
// ✅ 使用类型守卫而不是类型断言
interface SuccessResponse {
  data: Provider[]
}

interface ErrorResponse {
  error: string
}

type ApiResponse = SuccessResponse | ErrorResponse

// 类型守卫函数
function isSuccessResponse(response: ApiResponse): response is SuccessResponse {
  return 'data' in response
}

// 使用
const response: ApiResponse = await fetchData()
if (isSuccessResponse(response)) {
  console.log(response.data) // TypeScript 知道这是 SuccessResponse
} else {
  console.error(response.error) // TypeScript 知道这是 ErrorResponse
}
```

#### 2.4.2 Zod 验证（运行时类型检查）

```typescript
// ✅ 使用 Zod 进行运行时验证
import { z } from 'zod'

// 定义 schema
const providerSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url().optional(),
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  isActive: z.boolean().default(true),
})

// 推导类型
type ProviderInput = z.infer<typeof providerSchema>

// 验证数据
function createProvider(data: unknown): ProviderInput {
  return providerSchema.parse(data) // 抛出错误如果验证失败
}

// 安全验证（返回结果对象）
function validateProvider(data: unknown) {
  const result = providerSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten() }
  }
  return { success: true, data: result.data }
}
```

---

## 3. Next.js 15 开发规范

### 3.1 项目结构规范

```
api-proxy-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/
│   │   └── register/
│   ├── admin/                    # 管理后台
│   │   ├── providers/
│   │   ├── groups/
│   │   ├── api-keys/
│   │   └── layout.tsx            # 管理后台布局
│   ├── api/                      # API Routes
│   │   ├── proxy/
│   │   │   └── [group]/
│   │   │       └── route.ts
│   │   └── admin/
│   │       ├── providers/
│   │       └── groups/
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── global.css                # 全局样式
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── data-table.tsx
│   ├── providers/                # 提供商相关组件
│   │   ├── provider-form.tsx
│   │   └── provider-list.tsx
│   └── shared/                   # 共享组件
│       ├── header.tsx
│       └── footer.tsx
├── lib/                          # 工具函数和库
│   ├── db.ts                     # 数据库连接
│   ├── redis.ts                  # Redis 连接
│   ├── auth.ts                   # 认证工具
│   ├── proxy.ts                  # 代理核心逻辑
│   ├── utils.ts                  # 通用工具函数
│   └── validations.ts            # Zod schemas
├── schema/                       # Drizzle ORM schemas
│   ├── providers.ts
│   ├── groups.ts
│   ├── api-keys.ts
│   ├── users.ts
│   └── index.ts
├── types/                        # TypeScript 类型定义
│   ├── api.ts
│   ├── database.ts
│   └── index.ts
├── hooks/                        # 自定义 React Hooks
│   ├── use-providers.ts
│   └── use-health-status.ts
├── middleware.ts                 # Next.js 中间件
├── drizzle.config.ts             # Drizzle 配置
├── next.config.mjs               # Next.js 配置
├── tsconfig.json                 # TypeScript 配置
└── .eslintrc.json                # ESLint 配置
```

### 3.2 App Router 使用规范

#### 3.2.1 Server Components（默认）

```typescript
// app/admin/providers/page.tsx
// ✅ Server Component（默认，无需 'use client'）

import { db } from '@/lib/db'
import { providers } from '@/schema'
import { ProviderList } from '@/components/providers/provider-list'

// 服务器组件可以直接进行数据获取
async function getProviders() {
  return await db.select().from(providers).orderBy(providers.createdAt)
}

export default async function ProvidersPage() {
  const providerList = await getProviders()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">API 提供商管理</h1>
      <ProviderList providers={providerList} />
    </div>
  )
}
```

**Server Components 优势**:

- 零客户端 JavaScript（除非有 Client Components 子组件）
- 直接访问后端资源（数据库、文件系统）
- 自动代码分割
- 更好的 SEO

#### 3.2.2 Client Components

```typescript
// components/providers/provider-form.tsx
'use client' // ✅ 明确标记为客户端组件

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createProvider } from '@/app/actions/providers'

export function ProviderForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      await createProvider(formData)
      router.refresh() // 刷新服务器组件数据
      router.push('/admin/providers')
    } catch (error) {
      console.error('Failed to create provider:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit}>
      {/* 表单字段 */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? '创建中...' : '创建提供商'}
      </Button>
    </form>
  )
}
```

**何时使用 Client Components**:

- 需要使用 React Hooks (useState, useEffect 等)
- 需要事件监听器 (onClick, onChange 等)
- 需要使用浏览器 API
- 需要使用第三方客户端库

#### 3.2.3 组件组合模式

```typescript
// app/admin/providers/page.tsx (Server Component)
import { ProviderList } from '@/components/providers/provider-list'
import { AddProviderButton } from '@/components/providers/add-provider-button'

export default async function ProvidersPage() {
  const providers = await getProviders()

  return (
    <div>
      {/* Server Component 可以直接渲染 Client Component */}
      <AddProviderButton /> {/* Client Component */}

      {/* 传递数据给 Client Component */}
      <ProviderList providers={providers} /> {/* Client Component */}
    </div>
  )
}

// components/providers/provider-list.tsx (Client Component)
'use client'

import { Provider } from '@/types'
import { ProviderCard } from './provider-card' // 可以是 Server 或 Client Component

interface Props {
  providers: Provider[]
}

export function ProviderList({ providers }: Props) {
  // 客户端状态和交互
  const [filter, setFilter] = useState('')

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      {providers.filter(p => p.name.includes(filter)).map(provider => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
```

### 3.3 Server Actions

```typescript
// app/actions/providers.ts
'use server' // ✅ 标记为 Server Action

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { providerSchema } from '@/lib/validations'
import { auth } from '@/lib/auth'

// ✅ Server Action 必须始终进行认证检查
export async function createProvider(formData: FormData) {
  // 1. 认证检查
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // 2. 数据验证
  const rawData = {
    name: formData.get('name'),
    website: formData.get('website'),
    apiUrl: formData.get('apiUrl'),
    apiKey: formData.get('apiKey'),
  }

  const validated = providerSchema.parse(rawData)

  // 3. 数据库操作
  try {
    await db.insert(providers).values(validated)
  } catch (error) {
    throw new Error('Failed to create provider')
  }

  // 4. 重新验证缓存
  revalidatePath('/admin/providers')

  // 5. 重定向（可选）
  redirect('/admin/providers')
}

// ✅ Server Action 返回类型化的结果
export async function updateProvider(id: number, data: Partial<Provider>) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await db.update(providers).set(data).where(eq(providers.id, id))
    revalidatePath('/admin/providers')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Update failed' }
  }
}
```

**Server Actions 最佳实践**:

1. **始终验证输入**: 使用 Zod 等库验证所有输入数据
2. **始终进行认证**: 每个 Server Action 都必须检查用户认证和授权
3. **返回类型化结果**: 使用明确的返回类型
4. **错误处理**: 捕获并优雅处理错误
5. **重新验证**: 使用 `revalidatePath` 或 `revalidateTag` 更新缓存

### 3.4 API Routes 开发规范

#### 3.4.1 基本结构

```typescript
// app/api/admin/providers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { auth } from '@/lib/auth'

// ✅ 使用标准的 Web API (Request, Response)
export async function GET(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 查询参数解析
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 3. 数据库查询
    const providerList = await db
      .select()
      .from(providers)
      .limit(limit)
      .offset((page - 1) * limit)

    // 4. 返回响应
    return NextResponse.json({
      data: providerList,
      pagination: { page, limit },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = providerSchema.parse(body)

    const [newProvider] = await db.insert(providers).values(validated).returning()

    return NextResponse.json({ data: newProvider }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

#### 3.4.2 动态路由

```typescript
// app/api/admin/providers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const providerId = parseInt(params.id)

  if (isNaN(providerId)) {
    return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 })
  }

  const provider = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)

  if (!provider[0]) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  return NextResponse.json({ data: provider[0] })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // PUT 实现
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // DELETE 实现
}
```

#### 3.4.3 错误处理模式

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// app/api/admin/providers/route.ts
import { ApiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    // ... 业务逻辑

    if (!hasPermission) {
      throw new ApiError(403, 'Forbidden', { reason: 'Insufficient permissions' })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      )
    }

    // 未预期的错误
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### 3.5 中间件使用规范

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ✅ 定义需要保护的路径
const protectedPaths = ['/admin', '/api/admin']
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // 检查管理员权限
    if (pathname.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 已登录用户访问登录页，重定向到首页
  if (isAuthPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图像优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
```

**重要安全提示**:

- ❌ **不要只依赖中间件进行认证**（CVE-2025-29927 漏洞）
- ✅ **在每个 Server Component、Server Action、API Route 中都要验证认证**
- ✅ **使用数据访问层 (DAL) 模式集中认证检查**

---

## 4. React 组件开发规范

### 4.1 组件设计原则

#### 4.1.1 单一职责原则

```typescript
// ❌ 不好：组件做了太多事情
function ProviderManagement() {
  const [providers, setProviders] = useState([])
  const [filter, setFilter] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({})

  // 数据获取、过滤、表单处理、对话框管理...
  return (
    // 复杂的 JSX
  )
}

// ✅ 好：职责分离
function ProvidersPage() {
  return (
    <div>
      <PageHeader title="提供商管理" />
      <ProviderFilters />
      <ProviderList />
      <AddProviderDialog />
    </div>
  )
}

function ProviderList() {
  const providers = useProviders()
  const filter = useFilterStore()

  return (
    <div>
      {providers.filter(/* ... */).map(provider => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
```

#### 4.1.2 Props 设计

```typescript
// ✅ 好的 Props 设计
interface ProviderCardProps {
  // 明确的类型
  provider: Provider

  // 可选属性有默认值
  variant?: 'default' | 'compact'

  // 回调函数明确命名
  onEdit?: (provider: Provider) => void
  onDelete?: (id: number) => void

  // 布尔属性使用 is/has 前缀
  isLoading?: boolean
  isSelected?: boolean
}

export function ProviderCard({
  provider,
  variant = 'default',
  onEdit,
  onDelete,
  isLoading = false,
  isSelected = false,
}: ProviderCardProps) {
  // 组件实现
}

// ❌ 避免：过度使用 spread props
interface BadProps {
  [key: string]: any // 类型不安全
}
```

#### 4.1.3 组件组合

```typescript
// ✅ 使用组合模式而不是过度的 props

// 不好：通过 props 控制所有变体
<Button
  variant="primary"
  size="large"
  icon="plus"
  iconPosition="left"
  loading={true}
/>

// 好：通过组合实现
<Button variant="primary" size="lg" disabled={isLoading}>
  {isLoading ? (
    <Spinner className="mr-2" />
  ) : (
    <PlusIcon className="mr-2" />
  )}
  创建提供商
</Button>
```

### 4.2 Hooks 使用规范

#### 4.2.1 自定义 Hooks

```typescript
// hooks/use-providers.ts
import { useState, useEffect } from 'react'
import type { Provider } from '@/types'

interface UseProvidersOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseProvidersReturn {
  providers: Provider[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

// ✅ 自定义 Hook 必须以 use 开头
export function useProviders(
  options: UseProvidersOptions = {}
): UseProvidersReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options

  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/providers')
      if (!response.ok) throw new Error('Failed to fetch providers')
      const data = await response.json()
      setProviders(data.data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()

    if (autoRefresh) {
      const interval = setInterval(fetchProviders, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  return {
    providers,
    isLoading,
    error,
    refresh: fetchProviders,
  }
}

// 使用
function ProviderList() {
  const { providers, isLoading, error, refresh } = useProviders({
    autoRefresh: true,
    refreshInterval: 30000,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} onRetry={refresh} />

  return (
    <div>
      {providers.map(provider => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
```

#### 4.2.2 useEffect 使用规范

```typescript
// ✅ 明确的依赖数组
useEffect(() => {
  fetchData(userId)
}, [userId]) // 明确依赖

// ❌ 避免：缺少依赖或过度依赖
useEffect(() => {
  fetchData(userId) // ESLint 会警告
}, []) // 缺少 userId 依赖

useEffect(() => {
  // 每次渲染都执行
}, [someObject]) // 对象每次都是新的引用

// ✅ 对象依赖使用 useMemo
const config = useMemo(() => ({ url: apiUrl, key: apiKey }), [apiUrl, apiKey])

useEffect(() => {
  fetchWithConfig(config)
}, [config])

// ✅ 清理副作用
useEffect(() => {
  const controller = new AbortController()

  fetchData(controller.signal)

  return () => {
    controller.abort() // 清理
  }
}, [])
```

#### 4.2.3 常用 Hooks 模式

```typescript
// ✅ useState 的函数式更新
const [count, setCount] = useState(0)

// 好：使用函数式更新避免闭包陷阱
const increment = () => setCount((c) => c + 1)

// ✅ useCallback 缓存回调
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data, userId)
  },
  [userId] // 只有当 userId 变化时才重新创建
)

// ✅ useMemo 缓存计算结果
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b])

// ❌ 避免过度优化
// 简单的计算不需要 useMemo
const fullName = `${firstName} ${lastName}` // 不需要 useMemo
```

### 4.3 样式规范

#### 4.3.1 Tailwind CSS 使用

```typescript
// ✅ 使用 Tailwind 工具类
export function Button({ children, variant = 'default' }: ButtonProps) {
  return (
    <button
      className={cn(
        // 基础样式
        'rounded-md px-4 py-2 font-medium transition-colors',
        // 变体样式
        {
          'bg-primary text-primary-foreground hover:bg-primary/90':
            variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80':
            variant === 'secondary',
          'border border-input bg-background hover:bg-accent':
            variant === 'outline',
        }
      )}
    >
      {children}
    </button>
  )
}

// ✅ 使用 cn 工具函数合并类名
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 使用
<div className={cn('base-class', condition && 'conditional-class', className)} />
```

#### 4.3.2 响应式设计

```typescript
// ✅ 移动优先的响应式设计
<div className="
  grid gap-4
  grid-cols-1        // 移动端：1列
  sm:grid-cols-2     // 小屏幕：2列
  md:grid-cols-3     // 中等屏幕：3列
  lg:grid-cols-4     // 大屏幕：4列
">
  {/* 内容 */}
</div>
```

### 4.4 shadcn/ui 组件库使用

本项目使用 shadcn/ui 作为 UI 组件库。**重要提示**：shadcn/ui 不是传统的 npm 包，而是通过 CLI 将组件代码直接复制到项目中。

#### 4.4.1 什么是 shadcn/ui

```typescript
// ❌ 错误理解：shadcn/ui 不是 npm 包
import { Button } from 'shadcn/ui' // 这样导入是错误的

// ✅ 正确理解：组件代码在你的项目中
import { Button } from '@/components/ui/button' // 组件在你的代码库中
```

**核心概念**：

- **CLI 驱动**: 组件通过 CLI 工具添加到项目
- **代码所有权**: 组件代码完全归你所有，可自由修改
- **基于 Radix UI**: 底层使用 Radix UI 原语，保证可访问性
- **Tailwind 样式**: 使用 Tailwind CSS，完全可定制
- **类型安全**: 完整的 TypeScript 支持

#### 4.4.2 添加组件

```bash
# ✅ 添加单个组件
npx shadcn@latest add button

# ✅ 添加多个组件
npx shadcn@latest add button dialog dropdown-menu

# ✅ 交互式选择组件
npx shadcn@latest add

# ✅ 查看可用组件列表
npx shadcn@latest add --help
```

**添加流程**：

1. 运行 CLI 命令
2. CLI 从官方仓库下载组件代码
3. 组件文件被复制到 `components/ui/` 目录
4. 你可以立即使用和修改组件

#### 4.4.3 使用组件

```typescript
// ✅ 基本使用
'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function CreateProviderDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>创建提供商</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增 API 提供商</DialogTitle>
        </DialogHeader>
        {/* 对话框内容 */}
      </DialogContent>
    </Dialog>
  )
}

// ✅ 自定义组件样式
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CustomButton() {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-blue-500 to-purple-600",
        "hover:from-blue-600 hover:to-purple-700"
      )}
    >
      渐变按钮
    </Button>
  )
}
```

#### 4.4.4 组件定制

由于组件代码在你的项目中，你可以直接修改：

```typescript
// components/ui/button.tsx
// ✅ 可以直接修改组件代码

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'

  // ✅ 添加自定义 variant
  // 添加新的 loading 状态
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    )
  }
)
```

#### 4.4.5 组件组合模式

```typescript
// ✅ 使用组合模式构建复杂 UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{provider.name}</CardTitle>
          <Badge variant={provider.isActive ? 'default' : 'secondary'}>
            {provider.isActive ? '活跃' : '禁用'}
          </Badge>
        </div>
        <CardDescription>{provider.website}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>API URL: {provider.apiUrl}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">编辑</Button>
        <Button variant="destructive">删除</Button>
      </CardFooter>
    </Card>
  )
}
```

#### 4.4.6 常用组件推荐

**表单组件**：

- `input` - 输入框
- `label` - 标签
- `button` - 按钮
- `select` - 选择器
- `checkbox` - 复选框
- `radio-group` - 单选按钮组
- `textarea` - 文本域
- `form` - 表单（配合 react-hook-form）

**数据展示**：

- `table` - 表格
- `card` - 卡片
- `badge` - 徽章
- `avatar` - 头像

**反馈组件**：

- `dialog` - 对话框
- `alert` - 警告提示
- `toast` - 消息提示
- `progress` - 进度条

**导航组件**：

- `dropdown-menu` - 下拉菜单
- `tabs` - 标签页
- `navigation-menu` - 导航菜单

#### 4.4.7 重要规则

**❌ 不要直接使用 Radix UI**：

```typescript
// ❌ 错误：不要直接导入 Radix UI
import * as Dialog from '@radix-ui/react-dialog'

// ✅ 正确：使用 shadcn/ui 包装的组件
import { Dialog } from '@/components/ui/dialog'
```

**✅ 始终使用 shadcn/ui**：

- shadcn/ui 组件已经正确配置了可访问性
- 已经集成了 Tailwind 样式
- 提供了一致的 API 和类型定义
- 如果需要新的 Radix 功能，通过 shadcn/ui 添加新组件

**配置文件**：

```json
// components.json - shadcn/ui CLI 配置
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york", // 组件样式风格
  "rsc": true, // 支持 React Server Components
  "tsx": true, // 使用 TypeScript
  "tailwind": {
    "config": "", // Tailwind v4 无需配置文件
    "css": "app/globals.css", // 全局样式文件
    "cssVariables": true // 使用 CSS 变量主题
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 4.5 表单处理

```typescript
// ✅ 使用 React Hook Form + Zod
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const providerFormSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(255),
  website: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  apiUrl: z.string().url('请输入有效的API URL'),
  apiKey: z.string().min(1, 'API Key 不能为空'),
  isActive: z.boolean().default(true),
})

type ProviderFormData = z.infer<typeof providerFormSchema>

export function ProviderForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: '',
      website: '',
      apiUrl: '',
      apiKey: '',
      isActive: true,
    },
  })

  async function onSubmit(data: ProviderFormData) {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create provider')

      form.reset()
      onSuccess?.()
    } catch (error) {
      form.setError('root', {
        message: '创建失败，请重试',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>名称</label>
        <input {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* 其他字段 */}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? '创建中...' : '创建'}
      </button>

      {form.formState.errors.root && (
        <p className="text-sm text-red-500">
          {form.formState.errors.root.message}
        </p>
      )}
    </form>
  )
}
```

---

## 5. Drizzle ORM 使用规范

### 5.1 Schema 定义规范

#### 5.1.1 使用 Identity Columns（2025 标准）

```typescript
// schema/providers.ts
import { pgTable, integer, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'

// ✅ 使用 identity columns 而不是 serial（PostgreSQL 现代标准）
export const providers = pgTable('providers', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
  }),

  name: varchar('name', { length: 255 }).notNull(),
  website: text('website'),
  apiUrl: text('api_url').notNull(),
  apiKey: text('api_key').notNull(),
  isActive: boolean('is_active').notNull().default(true),

  // ✅ 使用 date mode (比 string mode 快 10-15%)
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

// ❌ 避免使用旧的 serial 类型
// id: serial('id').primaryKey(), // 已过时
```

#### 5.1.2 索引和约束

```typescript
// schema/providers.ts
import { pgTable, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const providers = pgTable(
  'providers',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    apiUrl: text('api_url').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    // ✅ 为常用查询字段添加索引
    isActiveIdx: index('providers_is_active_idx').on(table.isActive),

    // ✅ 复合索引（注意列顺序）
    activeCreatedIdx: index('providers_active_created_idx').on(
      table.isActive,
      table.createdAt.desc()
    ),

    // ✅ 唯一索引
    apiUrlUnique: uniqueIndex('providers_api_url_unique').on(table.apiUrl),
  })
)
```

#### 5.1.3 关系定义

```typescript
// schema/relations.ts
import { relations } from 'drizzle-orm'
import { providers } from './providers'
import { groups } from './groups'
import { groupProviders } from './group-providers'

// ✅ 定义关系以获得更好的类型推断
export const providersRelations = relations(providers, ({ many }) => ({
  groupProviders: many(groupProviders),
}))

export const groupsRelations = relations(groups, ({ many }) => ({
  groupProviders: many(groupProviders),
}))

export const groupProvidersRelations = relations(groupProviders, ({ one }) => ({
  provider: one(providers, {
    fields: [groupProviders.providerId],
    references: [providers.id],
  }),
  group: one(groups, {
    fields: [groupProviders.groupId],
    references: [groups.id],
  }),
}))
```

### 5.2 查询模式

#### 5.2.1 基本查询

```typescript
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

// ✅ 选择特定字段（避免 SELECT *）
const result = await db
  .select({
    id: providers.id,
    name: providers.name,
    apiUrl: providers.apiUrl,
  })
  .from(providers)
  .where(eq(providers.isActive, true))

// ✅ 使用条件构建器
const activeProviders = await db
  .select()
  .from(providers)
  .where(
    and(eq(providers.isActive, true), sql`${providers.createdAt} > NOW() - INTERVAL '30 days'`)
  )
  .orderBy(desc(providers.createdAt))
  .limit(10)

// ✅ 使用 Prepared Statements（频繁执行的查询）
const getProviderById = db
  .select()
  .from(providers)
  .where(eq(providers.id, sql.placeholder('id')))
  .prepare('get_provider_by_id')

// 执行
const provider = await getProviderById.execute({ id: 123 })
```

#### 5.2.2 关联查询

```typescript
// ✅ 使用关系查询（推荐）
import { db } from '@/lib/db'

const groupWithProviders = await db.query.groups.findFirst({
  where: eq(groups.id, groupId),
  with: {
    groupProviders: {
      with: {
        provider: true,
      },
      orderBy: desc(groupProviders.priority),
    },
  },
})

// ✅ 手动 JOIN 查询（更灵活）
const result = await db
  .select({
    groupId: groups.id,
    groupName: groups.name,
    providerId: providers.id,
    providerName: providers.name,
    priority: groupProviders.priority,
  })
  .from(groups)
  .leftJoin(groupProviders, eq(groups.id, groupProviders.groupId))
  .leftJoin(providers, eq(groupProviders.providerId, providers.id))
  .where(eq(groups.id, groupId))
```

#### 5.2.3 事务

```typescript
// ✅ 使用事务确保数据一致性
import { db } from '@/lib/db'

async function createGroupWithProviders(groupData: NewGroup, providerIds: number[]) {
  return await db.transaction(async (tx) => {
    // 1. 创建分组
    const [group] = await tx.insert(groups).values(groupData).returning()

    // 2. 关联提供商
    if (providerIds.length > 0) {
      await tx.insert(groupProviders).values(
        providerIds.map((providerId, index) => ({
          groupId: group.id,
          providerId,
          priority: providerIds.length - index,
        }))
      )
    }

    return group
  })
}

// 事务会在任何错误时自动回滚
```

### 5.3 类型安全

```typescript
// ✅ 使用 Drizzle 推导的类型
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { providers } from '@/schema'

// 查询结果类型
export type Provider = InferSelectModel<typeof providers>

// 插入数据类型
export type NewProvider = InferInsertModel<typeof providers>

// 使用
async function createProvider(data: NewProvider): Promise<Provider> {
  const [provider] = await db.insert(providers).values(data).returning()

  return provider
}

// ✅ 结合 Zod 进行运行时验证
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const insertProviderSchema = createInsertSchema(providers, {
  // 自定义验证规则
  name: (z) => z.min(1).max(255),
  apiUrl: (z) => z.url(),
  apiKey: (z) => z.min(10),
})

export const selectProviderSchema = createSelectSchema(providers)

// 使用
const validatedData = insertProviderSchema.parse(requestData)
await db.insert(providers).values(validatedData)
```

### 5.4 迁移策略

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './schema/*',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
```

```bash
# ✅ 迁移工作流

# 1. 修改 schema 文件后生成迁移
pnpm drizzle-kit generate:pg

# 2. 检查生成的迁移文件
# drizzle/migrations/0001_migration.sql

# 3. 应用迁移到数据库
pnpm drizzle-kit push:pg

# 4. 使用 Drizzle Studio 查看数据
pnpm drizzle-kit studio
```

**生产环境迁移最佳实践**:

1. 在 staging 环境先测试迁移
2. 备份生产数据库
3. 在低流量时段执行迁移
4. 监控迁移执行时间
5. 准备回滚脚本

---

## 6. Redis (ioredis) 使用规范

### 6.1 连接管理

```typescript
// lib/redis.ts
import Redis from 'ioredis'

// ✅ 创建单例 Redis 实例
let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      // 连接配置
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,

      // ✅ 启用自动 pipelining（性能优化）
      enableAutoPipelining: true,
      autoPipeliningIgnoredCommands: ['ping'],

      // 重连策略
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },

      // 连接池配置
      lazyConnect: false,

      // 错误处理
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          return true // 或 1/2 重连
        }
        return false
      },
    })

    // 监听事件
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis Client Connected')
    })

    redis.on('ready', () => {
      console.log('Redis Client Ready')
    })
  }

  return redis
}

// ✅ 优雅关闭
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

// 导出单例
export const redis = getRedis()
```

### 6.2 键命名规范

```typescript
// lib/redis-keys.ts

// ✅ 使用命名空间和一致的模式
export const RedisKeys = {
  // 端点健康状态: endpoint:health:{providerId}
  endpointHealth: (providerId: number) => `endpoint:health:${providerId}`,

  // 轮询权重: polling:weight:{groupId}:{providerId}
  pollingWeight: (groupId: number, providerId: number) => `polling:weight:${groupId}:${providerId}`,

  // 速率限制: ratelimit:{apiKeyId}:{window}
  rateLimit: (apiKeyId: number, window: number) => `ratelimit:${apiKeyId}:${window}`,

  // 分组端点列表: group:endpoints:{groupId}
  groupEndpoints: (groupId: number) => `group:endpoints:${groupId}`,

  // 统计数据: stats:provider:{providerId}:{date}
  providerStats: (providerId: number, date: string) => `stats:provider:${providerId}:${date}`,

  // 分布式锁: lock:endpoint:{providerId}
  endpointLock: (providerId: number) => `lock:endpoint:${providerId}`,
} as const

// 使用
import { redis } from '@/lib/redis'
import { RedisKeys } from '@/lib/redis-keys'

await redis.hset(RedisKeys.endpointHealth(123), {
  status: 'healthy',
  failureCount: 0,
  lastCheck: Date.now(),
})
```

### 6.3 数据结构使用

#### 6.3.1 Hash（对象存储）

```typescript
// ✅ 使用 Hash 存储对象
interface EndpointHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  failureCount: number
  lastCheck: number
  lastSuccess: number
  avgResponseTime: number
  successRate: number
}

async function setEndpointHealth(providerId: number, health: EndpointHealth): Promise<void> {
  const key = RedisKeys.endpointHealth(providerId)

  await redis.hset(key, {
    status: health.status,
    failureCount: health.failureCount.toString(),
    lastCheck: health.lastCheck.toString(),
    lastSuccess: health.lastSuccess.toString(),
    avgResponseTime: health.avgResponseTime.toString(),
    successRate: health.successRate.toString(),
  })

  // 设置过期时间
  await redis.expire(key, 300) // 5分钟
}

async function getEndpointHealth(providerId: number): Promise<EndpointHealth | null> {
  const key = RedisKeys.endpointHealth(providerId)
  const data = await redis.hgetall(key)

  if (!data || Object.keys(data).length === 0) {
    return null
  }

  return {
    status: data.status as EndpointHealth['status'],
    failureCount: parseInt(data.failureCount),
    lastCheck: parseInt(data.lastCheck),
    lastSuccess: parseInt(data.lastSuccess),
    avgResponseTime: parseFloat(data.avgResponseTime),
    successRate: parseFloat(data.successRate),
  }
}
```

#### 6.3.2 String（计数器、缓存）

```typescript
// ✅ 速率限制（滑动窗口）
async function checkRateLimit(
  apiKeyId: number,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const window = Math.floor(now / windowMs)
  const key = RedisKeys.rateLimit(apiKeyId, window)

  // 使用 pipeline 减少网络往返
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.pexpire(key, windowMs)

  const results = await pipeline.exec()
  const count = results![0][1] as number

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(maxRequests - count, 0),
  }
}

// ✅ 简单缓存
async function cacheGroupEndpoints(groupId: number, endpoints: Provider[]): Promise<void> {
  const key = RedisKeys.groupEndpoints(groupId)
  await redis.setex(key, 300, JSON.stringify(endpoints))
}

async function getCachedGroupEndpoints(groupId: number): Promise<Provider[] | null> {
  const key = RedisKeys.groupEndpoints(groupId)
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}
```

#### 6.3.3 Sorted Set（排序集合）

```typescript
// ✅ 使用 Sorted Set 存储带权重的数据
async function updateProviderScore(
  groupId: number,
  providerId: number,
  score: number
): Promise<void> {
  const key = `group:${groupId}:provider:scores`
  await redis.zadd(key, score, providerId.toString())
  await redis.expire(key, 300)
}

async function getTopProviders(
  groupId: number,
  limit: number = 5
): Promise<Array<{ providerId: number; score: number }>> {
  const key = `group:${groupId}:provider:scores`

  // 获取分数最高的 N 个成员
  const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES')

  const providers: Array<{ providerId: number; score: number }> = []
  for (let i = 0; i < results.length; i += 2) {
    providers.push({
      providerId: parseInt(results[i]),
      score: parseFloat(results[i + 1]),
    })
  }

  return providers
}
```

### 6.4 性能优化模式

#### 6.4.1 Pipeline（批量操作）

```typescript
// ✅ 使用 pipeline 批量操作
async function batchUpdateHealthStatus(
  updates: Array<{ providerId: number; health: EndpointHealth }>
): Promise<void> {
  const pipeline = redis.pipeline()

  for (const { providerId, health } of updates) {
    const key = RedisKeys.endpointHealth(providerId)
    pipeline.hset(key, health)
    pipeline.expire(key, 300)
  }

  await pipeline.exec()
}

// ❌ 避免：循环中的独立操作
async function badBatchUpdate(updates: any[]) {
  for (const update of updates) {
    await redis.hset(/* ... */) // 每次都是网络往返
    await redis.expire(/* ... */)
  }
}
```

#### 6.4.2 使用 SCAN 而不是 KEYS

```typescript
// ✅ 使用 SCAN 迭代键（不阻塞）
async function getAllHealthKeys(): Promise<string[]> {
  const pattern = 'endpoint:health:*'
  const keys: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, scanKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...scanKeys)
  } while (cursor !== '0')

  return keys
}

// ❌ 避免：使用 KEYS（会阻塞 Redis）
async function badGetAllKeys() {
  return await redis.keys('endpoint:health:*') // 危险！
}
```

#### 6.4.3 分布式锁

```typescript
// ✅ 简单的分布式锁实现
async function acquireLock(
  lockKey: string,
  lockId: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const result = await redis.set(
    lockKey,
    lockId,
    'EX',
    ttlSeconds,
    'NX' // 只在键不存在时设置
  )
  return result === 'OK'
}

async function releaseLock(lockKey: string, lockId: string): Promise<boolean> {
  // Lua 脚本确保原子性：只有持有锁的客户端才能释放
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `

  const result = await redis.eval(script, 1, lockKey, lockId)
  return result === 1
}

// 使用示例
async function performExclusiveOperation(providerId: number) {
  const lockKey = RedisKeys.endpointLock(providerId)
  const lockId = crypto.randomUUID()

  const acquired = await acquireLock(lockKey, lockId, 10)

  if (!acquired) {
    throw new Error('Could not acquire lock')
  }

  try {
    // 执行需要互斥的操作
    await criticalOperation(providerId)
  } finally {
    await releaseLock(lockKey, lockId)
  }
}
```

---

## 7. 认证与安全规范

### 7.1 NextAuth.js 使用规范

#### 7.1.1 配置

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'
import { db } from '@/lib/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  // ✅ 使用环境变量配置密钥
  secret: process.env.NEXTAUTH_SECRET,

  // ✅ 配置 session 策略
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  // ✅ 自定义页面
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        // 查询用户
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        // 验证密码
        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    // ✅ 在 JWT 中添加自定义字段
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    // ✅ 在 session 中添加自定义字段
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### 7.1.2 类型扩展

```typescript
// types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

### 7.2 数据访问层 (DAL) 模式

```typescript
// lib/dal.ts - 数据访问层
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { eq } from 'drizzle-orm'

// ✅ 使用 React cache 避免重复请求
export const getSession = cache(async () => {
  return await auth()
})

// ✅ 验证用户认证
async function verifySession() {
  const session = await getSession()

  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }

  return session
}

// ✅ 所有数据访问都通过 DAL，自动包含认证检查
export async function getProviders() {
  const session = await verifySession()

  // 可以根据用户角色返回不同数据
  if (session.user.role === 'admin') {
    return await db.select().from(providers)
  } else {
    return await db.select().from(providers).where(eq(providers.isActive, true))
  }
}

export async function getProviderById(id: number) {
  const session = await verifySession()

  const [provider] = await db.select().from(providers).where(eq(providers.id, id)).limit(1)

  if (!provider) {
    throw new Error('Provider not found')
  }

  return provider
}

export async function createProvider(data: NewProvider) {
  const session = await verifySession()

  // ✅ 检查权限
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  const [provider] = await db.insert(providers).values(data).returning()

  return provider
}

export async function updateProvider(id: number, data: Partial<Provider>) {
  const session = await verifySession()

  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  const [updated] = await db
    .update(providers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(providers.id, id))
    .returning()

  return updated
}
```

**使用 DAL**:

```typescript
// app/admin/providers/page.tsx
import { getProviders } from '@/lib/dal'

export default async function ProvidersPage() {
  // ✅ 自动进行认证检查
  const providers = await getProviders()

  return <ProviderList providers={providers} />
}

// app/api/admin/providers/route.ts
import { getProviders, createProvider } from '@/lib/dal'

export async function GET() {
  try {
    const providers = await getProviders() // 自动认证
    return NextResponse.json({ data: providers })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error }, { status: 401 })
    }
    return NextResponse.json({ error }, { status: 500 })
  }
}
```

### 7.3 API 安全最佳实践

#### 7.3.1 输入验证

```typescript
// ✅ 始终验证和清理输入
import { z } from 'zod'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 验证数据结构
  const schema = z.object({
    name: z.string().min(1).max(255),
    apiUrl: z.string().url(),
    apiKey: z.string().min(1).max(500),
  })

  const validation = schema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: validation.error.flatten(),
      },
      { status: 400 }
    )
  }

  // 使用验证后的数据
  const result = await createProvider(validation.data)
  return NextResponse.json({ data: result })
}
```

#### 7.3.2 速率限制

```typescript
// lib/rate-limit.ts
import { redis } from '@/lib/redis'
import { headers } from 'next/headers'

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  const now = Date.now()
  const window = Math.floor(now / windowMs)
  const key = `ratelimit:${identifier}:${window}`

  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.pexpire(key, windowMs)

  const results = await pipeline.exec()
  const count = results![0][1] as number

  return {
    success: count <= limit,
    remaining: Math.max(limit - count, 0),
    reset: (window + 1) * windowMs,
  }
}

// 在 API Route 中使用
export async function GET(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const rateLimitResult = await rateLimit(ip, 100, 60000)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    )
  }

  // 处理请求...
}
```

#### 7.3.3 CORS 配置

```typescript
// lib/cors.ts
import { NextResponse } from 'next/server'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

export function setCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

// 在 API Route 中使用
export async function OPTIONS(request: NextRequest) {
  return setCorsHeaders(
    new NextResponse(null, { status: 204 }),
    request.headers.get('origin') || undefined
  )
}

export async function GET(request: NextRequest) {
  const data = {
    /* ... */
  }
  const response = NextResponse.json(data)
  return setCorsHeaders(response, request.headers.get('origin') || undefined)
}
```

### 7.4 敏感数据处理

```typescript
// lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

// ✅ 加密敏感数据（如 API Keys）
export function encrypt(text: string, secret: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const key = scryptSync(secret, salt, KEY_LENGTH)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  // 格式: salt:iv:tag:encrypted
  return [salt.toString('hex'), iv.toString('hex'), tag.toString('hex'), encrypted].join(':')
}

export function decrypt(encryptedData: string, secret: string): string {
  const [saltHex, ivHex, tagHex, encrypted] = encryptedData.split(':')

  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const key = scryptSync(secret, salt, KEY_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// 使用示例
const encryptionSecret = process.env.ENCRYPTION_SECRET!

// 保存 API Key 到数据库时加密
const encryptedApiKey = encrypt(apiKey, encryptionSecret)
await db.insert(providers).values({
  ...data,
  apiKey: encryptedApiKey,
})

// 从数据库读取时解密
const provider = await db.query.providers.findFirst({ where: eq(providers.id, id) })
const decryptedApiKey = decrypt(provider.apiKey, encryptionSecret)
```

**环境变量安全**:

```bash
# .env.local
# ✅ 使用强密钥
NEXTAUTH_SECRET=your-super-secret-key-at-least-32-characters-long
ENCRYPTION_SECRET=another-strong-secret-for-data-encryption

# ✅ 数据库连接使用SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# ❌ 不要提交到版本控制
# 添加到 .gitignore
```

---

## 8. 代码质量工具配置

### 8.1 ESLint 配置

```json
// .eslintrc.json
{
  "$schema": "https://json.schemastore.org/eslintrc",
  "root": true,
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    // TypeScript 规则
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",

    // Import 规则
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal"
          }
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],

    // React 规则
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // 通用规则
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": ["node_modules/", ".next/", "out/", "drizzle/", "*.config.js", "*.config.mjs"]
}
```

### 8.2 Prettier 配置

详细配置已在单独文件中提供。

### 8.3 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    // 严格模式
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // 额外检查
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // 模块解析
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,

    // Next.js 特定
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],

    // 路径映射
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },

    // 其他
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 8.4 Git Hooks (Husky + lint-staged)

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm type-check
```

---

## 9. 测试规范

### 9.1 单元测试

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { calculateWeight, isHealthy } from '@/lib/utils'

describe('calculateWeight', () => {
  it('should calculate correct weight for healthy provider', () => {
    const health = {
      status: 'healthy' as const,
      failureCount: 0,
      successRate: 100,
      avgResponseTime: 100,
    }

    const weight = calculateWeight(50, health)

    expect(weight).toBeGreaterThan(50)
  })

  it('should penalize slow response times', () => {
    const fastHealth = { /* ... */ avgResponseTime: 100 }
    const slowHealth = { /* ... */ avgResponseTime: 1000 }

    const fastWeight = calculateWeight(50, fastHealth)
    const slowWeight = calculateWeight(50, slowHealth)

    expect(fastWeight).toBeGreaterThan(slowWeight)
  })
})
```

### 9.2 集成测试

```typescript
// __tests__/api/providers.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/admin/providers/route'

describe('/api/admin/providers', () => {
  beforeEach(async () => {
    // 清理测试数据库
    await cleanupTestDatabase()
  })

  describe('GET', () => {
    it('should return list of providers', async () => {
      const { req } = createMocks({
        method: 'GET',
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should require authentication', async () => {
      // 未认证请求
      const { req } = createMocks({
        method: 'GET',
        headers: {},
      })

      const response = await GET(req as any)

      expect(response.status).toBe(401)
    })
  })
})
```

### 9.3 E2E 测试 (Playwright)

```typescript
// e2e/admin/providers.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Provider Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/admin')
  })

  test('should create new provider', async ({ page }) => {
    await page.goto('/admin/providers')
    await page.click('text=新增提供商')

    await page.fill('input[name="name"]', 'Test Provider')
    await page.fill('input[name="apiUrl"]', 'https://api.test.com')
    await page.fill('input[name="apiKey"]', 'test-key-123')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Test Provider')).toBeVisible()
  })
})
```

---

## 10. Git 工作流规范

### 10.1 分支策略

```
main (production)
  ├── develop (开发主分支)
  │   ├── feature/provider-management
  │   ├── feature/api-proxy
  │   └── feature/monitoring-dashboard
  ├── hotfix/critical-bug-fix
  └── release/v1.0.0
```

**分支命名规范**:

- `feature/功能名称`: 新功能开发
- `bugfix/问题描述`: Bug 修复
- `hotfix/紧急修复`: 生产环境紧急修复
- `release/版本号`: 发布准备

### 10.2 Commit 消息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

**示例**:

```
feat(providers): add provider health check

Implement passive health checking that updates provider status based on
actual request results. Health status is cached in Redis with 5-minute TTL.

Closes #123
```

```
fix(proxy): handle null response in retry logic

Previously, the retry logic would crash if a provider returned null.
Now it properly handles null responses and moves to the next provider.

Fixes #456
```

### 10.3 Pull Request 流程

1. **创建分支**: 从 `develop` 创建 feature 分支
2. **开发功能**: 遵循代码规范
3. **提交代码**: 使用规范的 commit 消息
4. **推送分支**: `git push origin feature/xxx`
5. **创建 PR**: 填写 PR 模板
6. **Code Review**: 至少一人审核
7. **CI 通过**: 自动化测试通过
8. **合并代码**: Squash and merge 到 develop

**PR 模板**:

```markdown
## 变更说明

简要描述这个 PR 的目的和变更内容

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新
- [ ] 性能优化

## 相关 Issue

Closes #xxx

## 测试

描述如何测试这些变更

## 截图（如适用）

添加相关截图

## Checklist

- [ ] 代码遵循项目规范
- [ ] 已添加必要的测试
- [ ] 已更新相关文档
- [ ] 所有测试通过
- [ ] 无 TypeScript 错误
```

---

## 11. 文档规范

### 11.1 代码注释

```typescript
// ✅ 好的注释：解释"为什么"而不是"什么"

/**
 * 计算提供商的动态权重
 *
 * 权重基于多个因素：
 * - 基础优先级（配置的）
 * - 健康状态加成（健康/降级）
 * - 成功率加成（0-20分）
 * - 响应时间惩罚（越慢惩罚越大）
 * - 失败次数惩罚
 *
 * @param basePriority - 配置的基础优先级 (0-100)
 * @param health - 提供商的健康状态
 * @returns 计算后的权重分数 (最小为 1)
 *
 * @example
 * const weight = calculateWeight(50, {
 *   status: 'healthy',
 *   successRate: 95,
 *   avgResponseTime: 200,
 *   failureCount: 0
 * })
 * // returns: ~87
 */
export function calculateWeight(basePriority: number, health: EndpointHealth): number {
  // 使用指数移动平均是因为它对最近的数据更敏感
  // 这样可以更快地响应性能变化
  const healthBonus = health.status === 'healthy' ? 20 : health.status === 'degraded' ? 10 : 0

  // ...
}

// ✅ TODO 注释格式
// TODO(username): 添加更复杂的权重算法
// FIXME: 这里有潜在的竞态条件，需要加锁
// HACK: 临时解决方案，等待上游库修复

// ❌ 避免无用的注释
// 获取用户
const user = getUser() // 很明显，不需要注释
```

### 11.2 函数文档

````typescript
/**
 * 更新端点健康状态
 *
 * 此函数根据请求结果更新 Redis 中存储的端点健康状态。
 * 使用指数移动平均计算响应时间，使用增量调整计算成功率。
 *
 * @param providerId - 提供商的唯一标识符
 * @param success - 请求是否成功
 * @param responseTime - 响应时间（毫秒）
 * @param error - 如果请求失败，错误对象
 *
 * @throws {Error} 如果 Redis 连接失败
 *
 * @example
 * ```typescript
 * // 成功的请求
 * await updateEndpointHealth(123, true, 250)
 *
 * // 失败的请求
 * await updateEndpointHealth(123, false, 0, new Error('Timeout'))
 * ```
 *
 * @see {@link getEndpointHealth} 获取健康状态
 */
export async function updateEndpointHealth(
  providerId: number,
  success: boolean,
  responseTime: number,
  error?: Error
): Promise<void> {
  // 实现
}
````

### 11.3 README 维护

项目 README 应包含：

```markdown
# API 代理轮询系统

简要描述项目

## 特性

- 智能轮询算法
- 自动健康检查
- 管理后台
- ...

## 技术栈

- Next.js 15
- TypeScript 5.7
- Drizzle ORM
- Redis
- ...

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 安装

\`\`\`bash
pnpm install
\`\`\`

### 环境变量

复制 `.env.example` 到 `.env.local` 并配置

### 数据库迁移

\`\`\`bash
pnpm db:push
\`\`\`

### 开发

\`\`\`bash
pnpm dev
\`\`\`

## 项目结构

见 CODE-STANDARDS.md

## 贡献

见 CONTRIBUTING.md

## License

MIT
```

---

## 12. 性能优化指南

### 12.1 数据库查询优化

```typescript
// ✅ 只选择需要的字段
const providers = await db
  .select({
    id: providers.id,
    name: providers.name,
    isActive: providers.isActive,
  })
  .from(providers)

// ❌ 避免 SELECT *
const providers = await db
  .select()
  .from(providers)

  // ✅ 使用索引字段进行过滤
  .where(eq(providers.isActive, true)) // isActive 有索引

  // ✅ 使用 LIMIT 限制结果集
  .limit(100)

// ✅ 使用 Prepared Statements
const getActiveProviders = db
  .select()
  .from(providers)
  .where(eq(providers.isActive, sql.placeholder('active')))
  .prepare('get_active_providers')
```

### 12.2 Redis 缓存策略

```typescript
// ✅ 缓存频繁访问的数据
async function getGroupEndpoints(groupId: number) {
  const cacheKey = RedisKeys.groupEndpoints(groupId)

  // 1. 尝试从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // 2. 缓存未命中，查询数据库
  const endpoints = await db
    .select()
    .from(groupProviders)
    .where(eq(groupProviders.groupId, groupId))

  // 3. 写入缓存
  await redis.setex(cacheKey, 300, JSON.stringify(endpoints))

  return endpoints
}

// ✅ 缓存失效策略
async function updateProvider(id: number, data: Partial<Provider>) {
  await db.update(providers).set(data).where(eq(providers.id, id))

  // 主动使相关缓存失效
  const groups = await getProviderGroups(id)
  for (const group of groups) {
    await redis.del(RedisKeys.groupEndpoints(group.id))
  }
}
```

### 12.3 Next.js 性能优化

```typescript
// ✅ 使用 Next.js 缓存
import { unstable_cache } from 'next/cache'

export const getCachedProviders = unstable_cache(
  async () => {
    return await db.select().from(providers)
  },
  ['providers-list'],
  {
    revalidate: 300, // 5 分钟
    tags: ['providers'],
  }
)

// 使缓存失效
import { revalidateTag } from 'next/cache'

export async function createProvider(data: NewProvider) {
  await db.insert(providers).values(data)
  revalidateTag('providers')
}

// ✅ 使用 Server Components 进行数据预取
export default async function ProvidersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 在布局层级预取数据
  const providersPromise = getCachedProviders()

  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <ProvidersList providersPromise={providersPromise} />
      </Suspense>
      {children}
    </div>
  )
}

// ✅ 图片优化
import Image from 'next/image'

<Image
  src="/provider-logo.png"
  alt="Provider Logo"
  width={200}
  height={100}
  priority // 首屏图片
  placeholder="blur" // 模糊占位符
/>
```

---

## 附录

### A. 常见反模式

```typescript
// ❌ 反模式 1: 在循环中进行数据库查询
for (const id of providerIds) {
  const provider = await db.query.providers.findFirst({
    where: eq(providers.id, id),
  })
}

// ✅ 正确做法：使用 IN 查询
const providerList = await db.select().from(providers).where(inArray(providers.id, providerIds))

// ❌ 反模式 2: 过度使用 useEffect
useEffect(() => {
  fetchData()
}, []) // 每次挂载都调用

// ✅ 正确做法：使用 Server Components 或 useSWR
const { data } = useSWR('/api/providers', fetcher)

// ❌ 反模式 3: 不处理错误
const data = await fetch('/api/providers').then((r) => r.json())

// ✅ 正确做法：始终处理错误
try {
  const response = await fetch('/api/providers')
  if (!response.ok) throw new Error('Fetch failed')
  const data = await response.json()
} catch (error) {
  console.error('Error:', error)
}
```

### B. 工具推荐

- **VSCode 扩展**:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma (适用于查看 Drizzle schema)

- **调试工具**:
  - React Developer Tools
  - Redux DevTools (如果使用 Redux)
  - Drizzle Studio

### C. 参考资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**文档版本**: 1.0
**最后更新**: 2025-10-17
**维护者**: 开发团队

本文档是一个活文档，会随着项目发展和最佳实践的变化而更新。如有建议或发现错误，请提交 Issue 或 PR。
