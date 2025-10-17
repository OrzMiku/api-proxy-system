import { requireAuth } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { providers, groups, apiKeys, requestLogs } from '@/schema'
import { count } from 'drizzle-orm'
import { redis } from '@/lib/redis'
import { Server, FolderKanban, Key, Activity } from 'lucide-react'

/**
 * Admin Dashboard Home Page
 * Shows overview statistics and system status
 */
export default async function AdminDashboard() {
  const session = await requireAuth()

  // Fetch statistics from database
  const [providersCount] = await db.select({ count: count() }).from(providers)
  const [groupsCount] = await db.select({ count: count() }).from(groups)
  const [apiKeysCount] = await db.select({ count: count() }).from(apiKeys)
  const [requestsCount] = await db.select({ count: count() }).from(requestLogs)

  // Check Redis connection
  let redisStatus = '正常'
  try {
    await redis.ping()
  } catch (error) {
    redisStatus = '异常'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来, {session.user.name || session.user.email}</h1>
        <p className="text-gray-600 dark:text-gray-400">这是您的 API 代理系统控制面板</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">提供商</CardTitle>
            <Server className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providersCount?.count ?? 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">已配置的 API 提供商</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分组</CardTitle>
            <FolderKanban className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupsCount?.count ?? 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">API 端点分组</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeysCount?.count ?? 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">已生成的访问密钥</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">请求总数</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsCount?.count ?? 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">代理请求统计</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>服务健康状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>数据库</span>
              <span className="text-green-600">正常</span>
            </div>
            <div className="flex justify-between">
              <span>Redis</span>
              <span className={redisStatus === '正常' ? 'text-green-600' : 'text-red-600'}>
                {redisStatus}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
