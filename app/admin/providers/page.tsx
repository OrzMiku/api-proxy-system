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
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { ProviderDialog } from '@/components/providers/provider-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Provider = {
  id: number
  name: string
  baseUrl: string
  description: string | null
  isEnabled: boolean
  priority: number
  timeout: number
  createdAt: Date
  updatedAt: Date
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProviderId, setDeletingProviderId] = useState<number | null>(null)

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers')
      if (!response.ok) throw new Error('Failed to fetch providers')
      const data = await response.json()
      setProviders(data.providers)
    } catch (error) {
      toast.error('加载提供商列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/providers/${id}/toggle`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Failed to toggle provider')
      toast.success('提供商状态已更新')
      fetchProviders()
    } catch (error) {
      toast.error('更新状态失败')
      console.error(error)
    }
  }

  const handleDelete = (id: number) => {
    setDeletingProviderId(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingProviderId) return

    try {
      const response = await fetch(`/api/admin/providers/${deletingProviderId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete provider')
      toast.success('提供商已删除')
      fetchProviders()
    } catch (error) {
      toast.error('删除失败')
      console.error(error)
    } finally {
      setDeletingProviderId(null)
    }
  }

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setDialogOpen(true)
  }

  const handleDialogClose = (success?: boolean) => {
    setDialogOpen(false)
    setEditingProvider(null)
    if (success) {
      fetchProviders()
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">提供商管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理 API 端点提供商</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增提供商
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>提供商列表</CardTitle>
          <CardDescription>共 {providers.length} 个提供商</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">暂无提供商</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                添加第一个提供商
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>超时时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{provider.baseUrl}</TableCell>
                    <TableCell>{provider.priority}</TableCell>
                    <TableCell>{provider.timeout}ms</TableCell>
                    <TableCell>
                      <Badge variant={provider.isEnabled ? 'default' : 'outline'}>
                        {provider.isEnabled ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(provider.id)}
                          title={provider.isEnabled ? '禁用' : '启用'}
                        >
                          {provider.isEnabled ? (
                            <PowerOff className="mr-1 h-4 w-4" />
                          ) : (
                            <Power className="mr-1 h-4 w-4" />
                          )}
                          {provider.isEnabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(provider)}
                          title="编辑"
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(provider.id)}
                          title="删除"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
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

      <ProviderDialog open={dialogOpen} onClose={handleDialogClose} provider={editingProvider} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="删除提供商"
        description="确定要删除这个提供商吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </div>
  )
}
