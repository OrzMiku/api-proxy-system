'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, PowerOff, Power, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ApiKeyDialog } from '@/components/api-keys/api-key-dialog'

type ApiKey = {
  id: number
  name: string
  key: string // masked
  description: string | null
  groupId: number | null
  isEnabled: boolean
  rateLimit: number
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')
      const data = await response.json()
      setApiKeys(data.apiKeys)
    } catch (error) {
      toast.error('加载 API Keys 列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}/toggle`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Failed to toggle API key')
      toast.success('API Key 状态已更新')
      fetchApiKeys()
    } catch (error) {
      toast.error('更新状态失败')
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个 API Key 吗？此操作无法撤销。')) return

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete API key')
      toast.success('API Key 已删除')
      fetchApiKeys()
    } catch (error) {
      toast.error('删除失败')
      console.error(error)
    }
  }

  const handleEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey)
    setDialogOpen(true)
  }

  const handleCopy = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedId(id)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleDialogClose = (success?: boolean) => {
    setDialogOpen(false)
    setEditingKey(null)
    if (success) {
      fetchApiKeys()
    }
  }

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys 管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理 API 访问密钥</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增 API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys 列表</CardTitle>
          <CardDescription>共 {apiKeys.length} 个 API Key</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无 API Key</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                创建第一个 API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>速率限制</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>最后使用</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      {key.name}
                      {key.description && (
                        <p className="text-sm text-gray-500">{key.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                          {key.key}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(key.key, key.id)}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.groupId ? 'outline' : 'default'}>
                        {key.groupId ? '分组' : '全局'}
                      </Badge>
                    </TableCell>
                    <TableCell>{key.rateLimit}/分钟</TableCell>
                    <TableCell>
                      {isExpired(key.expiresAt) ? (
                        <Badge variant="destructive">已过期</Badge>
                      ) : (
                        formatDate(key.expiresAt)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(key.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !key.isEnabled || isExpired(key.expiresAt) ? 'outline' : 'default'
                        }
                      >
                        {!key.isEnabled
                          ? '禁用'
                          : isExpired(key.expiresAt)
                            ? '已过期'
                            : '启用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(key.id)}
                          title={key.isEnabled ? '禁用' : '启用'}
                        >
                          {key.isEnabled ? (
                            <PowerOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Power className="h-4 w-4 mr-1" />
                          )}
                          {key.isEnabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(key)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(key.id)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ApiKeyDialog open={dialogOpen} onClose={handleDialogClose} apiKey={editingKey} />
    </div>
  )
}
