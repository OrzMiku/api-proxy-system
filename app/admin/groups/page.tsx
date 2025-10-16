'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Pencil, Trash2, PowerOff, Power, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { GroupDialog } from '@/components/groups/group-dialog'

type Group = {
  id: number
  name: string
  slug: string
  description: string | null
  isEnabled: boolean
  pollingStrategy: string
  createdAt: Date
  updatedAt: Date
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      const data = await response.json()
      setGroups(data.groups)
    } catch (error) {
      toast.error('加载分组列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/groups/${id}/toggle`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Failed to toggle group')
      toast.success('分组状态已更新')
      fetchGroups()
    } catch (error) {
      toast.error('更新状态失败')
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个分组吗？此操作将同时删除关联的提供商关系。')) return

    try {
      const response = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete group')
      toast.success('分组已删除')
      fetchGroups()
    } catch (error) {
      toast.error('删除失败')
      console.error(error)
    }
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setDialogOpen(true)
  }

  const handleManageProviders = (groupId: number) => {
    router.push(`/admin/groups/${groupId}`)
  }

  const handleDialogClose = (success?: boolean) => {
    setDialogOpen(false)
    setEditingGroup(null)
    if (success) {
      fetchGroups()
    }
  }

  const getPollingStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      'weighted-round-robin': '加权轮询',
      'least-connections': '最少连接',
      'ip-hash': 'IP Hash',
      random: '随机',
      'round-robin': '轮询',
    }
    return labels[strategy] || strategy
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
          <h1 className="text-3xl font-bold">分组管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理提供商分组</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增分组
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分组列表</CardTitle>
          <CardDescription>共 {groups.length} 个分组</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无分组</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                添加第一个分组
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>轮询策略</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {group.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPollingStrategyLabel(group.pollingStrategy)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {group.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.isEnabled ? 'default' : 'outline'}>
                        {group.isEnabled ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageProviders(group.id)}
                          title="管理提供商"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          提供商
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(group.id)}
                          title={group.isEnabled ? '禁用' : '启用'}
                        >
                          {group.isEnabled ? (
                            <PowerOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Power className="h-4 w-4 mr-1" />
                          )}
                          {group.isEnabled ? '禁用' : '启用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(group)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(group.id)}
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

      <GroupDialog open={dialogOpen} onClose={handleDialogClose} group={editingGroup} />
    </div>
  )
}
