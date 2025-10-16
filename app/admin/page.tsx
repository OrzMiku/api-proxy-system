import { requireAuth } from '@/lib/dal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Admin Dashboard Home Page
 * Shows overview statistics and system status
 */
export default async function AdminDashboard() {
  const session = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来, {session.user.name || session.user.email}</h1>
        <p className="text-gray-600 dark:text-gray-400">这是您的 API 代理系统控制面板</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>提供商</CardTitle>
            <CardDescription>已配置的 API 提供商</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分组</CardTitle>
            <CardDescription>API 端点分组</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>已生成的访问密钥</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>请求总数</CardTitle>
            <CardDescription>代理请求统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
              <span className="text-green-600">正常</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
