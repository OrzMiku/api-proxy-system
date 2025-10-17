'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { ArrowLeft, Plus, Trash2, PowerOff, Power, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { AddProviderDialog } from '@/components/groups/add-provider-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Group = {
  id: number
  name: string
  slug: string
  description: string | null
  isEnabled: boolean
  pollingStrategy: string
}

type GroupProvider = {
  id: number
  providerId: number
  priority: number
  isEnabled: boolean
  provider: {
    id: number
    name: string
    baseUrl: string
    description: string | null
    isEnabled: boolean
    priority: number
    timeout: number
  }
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = parseInt(params['id'] as string)

  const [group, setGroup] = useState<Group | null>(null)
  const [groupProviders, setGroupProviders] = useState<GroupProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [removingProviderId, setRemovingProviderId] = useState<number | null>(null)

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}`)
      if (!response.ok) throw new Error('Failed to fetch group')
      const data = await response.json()
      setGroup(data.group)
    } catch (error) {
      toast.error('加载分组信息失败')
      console.error(error)
    }
  }

  const fetchGroupProviders = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/providers`)
      if (!response.ok) throw new Error('Failed to fetch group providers')
      const data = await response.json()
      setGroupProviders(data.providers)
    } catch (error) {
      toast.error('加载提供商列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (groupId) {
      fetchGroup()
      fetchGroupProviders()
    }
  }, [groupId])

  const handleToggleProvider = async (providerId: number) => {
    const provider = groupProviders.find((gp) => gp.providerId === providerId)
    if (!provider) return

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !provider.isEnabled }),
      })
      if (!response.ok) throw new Error('Failed to toggle provider')
      toast.success('提供商状态已更新')
      fetchGroupProviders()
    } catch (error) {
      toast.error('更新状态失败')
      console.error(error)
    }
  }

  const handleRemoveProvider = (providerId: number) => {
    setRemovingProviderId(providerId)
    setRemoveConfirmOpen(true)
  }

  const confirmRemoveProvider = async () => {
    if (!removingProviderId) return

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/providers/${removingProviderId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove provider')
      toast.success('提供商已移除')
      fetchGroupProviders()
    } catch (error) {
      toast.error('移除失败')
      console.error(error)
    } finally {
      setRemovingProviderId(null)
    }
  }

  const handleUpdatePriority = async (providerId: number, newPriority: number) => {
    if (newPriority < 0 || newPriority > 1000) {
      toast.error('优先级必须在 0-1000 之间')
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (!response.ok) throw new Error('Failed to update priority')
      toast.success('优先级已更新')
      fetchGroupProviders()
    } catch (error) {
      toast.error('更新失败')
      console.error(error)
    }
  }

  const handleAddDialogClose = (success?: boolean) => {
    setAddDialogOpen(false)
    if (success) {
      fetchGroupProviders()
    }
  }

  const getPollingStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      'weighted-round-robin': '加权轮询',
      'priority-failover': '优先级故障转移',
      'least-connections': '最少连接',
      'ip-hash': 'IP Hash',
      random: '随机',
      'round-robin': '轮询',
    }
    return labels[strategy] || strategy
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="mb-4 text-gray-500">分组不存在</p>
        <Button onClick={() => router.push('/admin/groups')}>返回分组列表</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/groups')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理分组中的提供商 · Slug:{' '}
            <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
              {group.slug}
            </code>
          </p>
        </div>
        <Badge variant={group.isEnabled ? 'default' : 'outline'}>
          {group.isEnabled ? '启用' : '禁用'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>分组信息</CardTitle>
              <CardDescription>
                轮询策略: {getPollingStrategyLabel(group.pollingStrategy)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {group.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>提供商列表</CardTitle>
              <CardDescription>共 {groupProviders.length} 个提供商</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加提供商
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groupProviders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">暂无提供商</p>
              <Button onClick={() => setAddDialogOpen(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                添加第一个提供商
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>提供商名称</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>提供商状态</TableHead>
                  <TableHead>分组内状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupProviders.map((gp) => (
                  <TableRow key={gp.id}>
                    <TableCell className="font-medium">{gp.provider.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{gp.provider.baseUrl}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePriority(gp.providerId, gp.priority + 10)}
                          disabled={gp.priority >= 1000}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <span className="min-w-[3rem] text-center font-mono">{gp.priority}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePriority(gp.providerId, gp.priority - 10)}
                          disabled={gp.priority <= 0}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={gp.provider.isEnabled ? 'default' : 'outline'}>
                        {gp.provider.isEnabled ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={gp.isEnabled ? 'default' : 'outline'}>
                        {gp.isEnabled ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleProvider(gp.providerId)}
                          title={gp.isEnabled ? '在此分组中禁用' : '在此分组中启用'}
                        >
                          {gp.isEnabled ? (
                            <PowerOff className="mr-1 h-4 w-4" />
                          ) : (
                            <Power className="mr-1 h-4 w-4" />
                          )}
                          {gp.isEnabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveProvider(gp.providerId)}
                          title="从分组移除"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          移除
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

      <AddProviderDialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        groupId={groupId}
        existingProviderIds={groupProviders.map((gp) => gp.providerId)}
      />

      <ConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        onConfirm={confirmRemoveProvider}
        title="移除提供商"
        description="确定要从此分组移除该提供商吗？"
        confirmText="移除"
        cancelText="取消"
        variant="destructive"
      />
    </div>
  )
}
