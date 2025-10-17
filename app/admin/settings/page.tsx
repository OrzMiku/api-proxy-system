import { requireAuth } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Server as RedisIcon, Key, Shield, Zap } from 'lucide-react'
import { redis } from '@/lib/redis'

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
        <p className="text-gray-600 dark:text-gray-400">系统配置和环境信息</p>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
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

        <Card>
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

        <Card>
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

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>当前用户</CardTitle>
          <CardDescription>登录用户信息</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">用户名</dt>
              <dd className="text-sm">{session.user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">姓名</dt>
              <dd className="text-sm">{session.user.name || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">角色</dt>
              <dd className="text-sm">
                <Badge>{session.user.role}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">用户 ID</dt>
              <dd className="text-sm">{session.user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle>系统功能</CardTitle>
          <CardDescription>已启用的核心功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium">加权轮询算法</h3>
                <p className="text-sm text-gray-600">
                  基于健康状态、成功率和响应时间的智能负载均衡
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium">健康检查</h3>
                <p className="text-sm text-gray-600">
                  被动式健康监控，自动失败转移
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium">API Key 管理</h3>
                <p className="text-sm text-gray-600">
                  支持全局和分组级别的访问控制
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RedisIcon className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium">Redis 缓存</h3>
                <p className="text-sm text-gray-600">
                  健康状态、权重计算和 API Key 缓存
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader>
          <CardTitle>环境配置</CardTitle>
          <CardDescription>系统环境变量</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Node 环境</dt>
              <dd className="text-sm font-mono">{process.env['NODE_ENV'] || 'development'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">应用名称</dt>
              <dd className="text-sm">{process.env['APP_NAME'] || 'API Proxy System'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">应用 URL</dt>
              <dd className="text-sm font-mono">{process.env['APP_URL'] || 'http://localhost:3000'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">日志级别</dt>
              <dd className="text-sm font-mono">{process.env['LOG_LEVEL'] || 'info'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">数据库</dt>
              <dd className="text-sm font-mono">SQLite</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Redis</dt>
              <dd className="text-sm font-mono">
                {redisStatus === '正常' ? 'Upstash Redis (Connected)' : 'Disconnected'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
