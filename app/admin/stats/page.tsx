'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

type ProviderStat = {
  id: number
  name: string
  baseUrl: string
  isEnabled: boolean
  priority: number
  health: {
    healthy: boolean
    consecutiveFailures: number
    lastCheck: number
    successRate: number
    avgResponseTime: number
  }
  stats: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
  }
}

type RequestLog = {
  id: number
  method: string
  path: string
  statusCode: number | null
  responseTime: number | null
  success: boolean
  errorMessage: string | null
  clientIp: string | null
  createdAt: Date
  providerName: string | null
  apiKeyName: string | null
}

type OverviewStats = {
  overview: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    successRate: number
    avgResponseTime: number
  }
  requestsByHour: Array<{
    hour: string
    count: number
    successCount: number
    failCount: number
  }>
}

export default function StatsPage() {
  const [providers, setProviders] = useState<ProviderStat[]>([])
  const [recentRequests, setRecentRequests] = useState<RequestLog[]>([])
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [providersRes, requestsRes, overviewRes] = await Promise.all([
        fetch('/api/admin/stats/providers'),
        fetch('/api/admin/stats/recent-requests?limit=10'),
        fetch('/api/admin/stats/overview'),
      ])

      const [providersData, requestsData, overviewData] = await Promise.all([
        providersRes.json(),
        requestsRes.json(),
        overviewRes.json(),
      ])

      setProviders(providersData.providers || [])
      setRecentRequests(requestsData.requests || [])

      // Only set overview if it has the expected structure
      if (overviewData && overviewData.overview) {
        setOverview(overviewData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">统计分析</h1>
        <p className="text-gray-600 dark:text-gray-400">系统性能和请求统计</p>
      </div>

      {/* Overview Stats */}
      {overview?.overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总请求数</CardTitle>
              <Activity className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overview.totalRequests}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                成功率: {overview.overview.successRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功请求</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overview.overview.successfulRequests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">失败请求</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overview.overview.failedRequests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.overview.avgResponseTime}ms</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider 健康状态</CardTitle>
          <CardDescription>实时监控所有提供商的健康状况和性能指标</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>健康度</TableHead>
                <TableHead>成功率</TableHead>
                <TableHead>响应时间</TableHead>
                <TableHead>请求统计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-gray-500">{provider.baseUrl}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.isEnabled ? 'default' : 'secondary'}>
                      {provider.isEnabled ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {provider.health.healthy ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">健康</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-600">
                            异常 ({provider.health.consecutiveFailures} 次失败)
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span>{provider.health.successRate.toFixed(2)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{Math.round(provider.health.avgResponseTime)}ms</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>总计: {provider.stats.totalRequests}</div>
                      <div className="text-green-600">
                        成功: {provider.stats.successfulRequests}
                      </div>
                      {provider.stats.failedRequests > 0 && (
                        <div className="text-red-600">失败: {provider.stats.failedRequests}</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>最近请求</CardTitle>
          <CardDescription>最近 10 条代理请求日志</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>方法</TableHead>
                <TableHead>路径</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>响应时间</TableHead>
                <TableHead>客户端 IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-xs">
                    {new Date(request.createdAt).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs" title={request.path}>
                    {request.path}
                  </TableCell>
                  <TableCell className="text-xs">{request.providerName || '-'}</TableCell>
                  <TableCell>
                    {request.success ? (
                      <Badge className="bg-green-600">{request.statusCode || 200}</Badge>
                    ) : (
                      <Badge variant="destructive">{request.statusCode || 500}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {request.responseTime ? `${request.responseTime}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-xs">{request.clientIp || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
