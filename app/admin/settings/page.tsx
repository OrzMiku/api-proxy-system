import { requireAuth } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Server as RedisIcon, Shield } from 'lucide-react'
import { redis } from '@/lib/redis'
import { AccountSettings } from '@/components/settings/account-settings'

/**
 * Settings Page
 * System configuration and environment information
 */
export default async function SettingsPage() {
  const session = await requireAuth()

  // Check Redis connection
  let redisStatus = '正常'
  try {
    await redis.ping()
    redisStatus = '正常'
  } catch (error) {
    redisStatus = '异常'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">系统设置</h1>
        <p className="text-gray-600 dark:text-gray-400">账号管理与系统信息</p>
      </div>

      {/* System Status */}
      <div className="grid place-items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据库</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">正常</Badge>
              <span className="text-sm text-gray-600">SQLite</span>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis 缓存</CardTitle>
            <RedisIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={redisStatus === '正常' ? 'bg-green-600' : 'bg-red-600'}>
                {redisStatus}
              </Badge>
              {redisStatus === '正常' && (
                <span className="text-sm text-gray-600">Upstash Redis</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">认证</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">正常</Badge>
              <span className="text-sm text-gray-600">NextAuth.js v5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Information */}
        <AccountSettings user={session.user} />

        {/* Environment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>环境配置</CardTitle>
            <CardDescription>系统环境变量</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">Node 环境</dt>
                <dd className="font-mono text-sm">{process.env['NODE_ENV'] || 'development'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">应用名称</dt>
                <dd className="text-sm">{process.env['APP_NAME'] || 'API Proxy System'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">应用 URL</dt>
                <dd className="font-mono text-sm">
                  {process.env['APP_URL'] || 'http://localhost:3000'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">日志级别</dt>
                <dd className="font-mono text-sm">{process.env['LOG_LEVEL'] || 'info'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">数据库</dt>
                <dd className="font-mono text-sm">SQLite</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">Redis</dt>
                <dd className="font-mono text-sm">
                  {redisStatus === '正常' ? 'Redis (Connected)' : 'Disconnected'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
