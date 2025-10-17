'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type Provider = {
  id: number
  name: string
  baseUrl: string
  description: string | null
  isEnabled: boolean
}

type AddProviderDialogProps = {
  open: boolean
  onClose: (success?: boolean) => void
  groupId: number
  existingProviderIds: number[]
}

export function AddProviderDialog({
  open,
  onClose,
  groupId,
  existingProviderIds,
}: AddProviderDialogProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const [priority, setPriority] = useState<string>('100')
  const [isEnabled, setIsEnabled] = useState<string>('true')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchProviders()
      setSelectedProviderId('')
      setPriority('100')
      setIsEnabled('true')
    }
  }, [open])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/providers')
      if (!response.ok) throw new Error('Failed to fetch providers')
      const data = await response.json()
      // Filter out providers already in the group
      const availableProviders = data.providers.filter(
        (p: Provider) => !existingProviderIds.includes(p.id)
      )
      setProviders(availableProviders)
    } catch (error) {
      toast.error('加载提供商列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProviderId) {
      toast.error('请选择提供商')
      return
    }

    const priorityNum = parseInt(priority)
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 1000) {
      toast.error('优先级必须在 0-1000 之间')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: parseInt(selectedProviderId),
          priority: priorityNum,
          isEnabled: isEnabled === 'true',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add provider')
      }

      toast.success('提供商已添加')
      onClose(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>添加提供商</DialogTitle>
          <DialogDescription>将提供商添加到此分组</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">加载中...</div>
        ) : providers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">没有可添加的提供商</p>
            <p className="mt-2 text-sm text-gray-400">所有提供商都已在此分组中，或者暂无提供商</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">选择提供商</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="选择一个提供商" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        <Badge
                          variant={provider.isEnabled ? 'default' : 'outline'}
                          className="ml-2"
                        >
                          {provider.isEnabled ? '启用' : '禁用'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProviderId && (
                <p className="text-sm text-gray-500">
                  {providers.find((p) => p.id === parseInt(selectedProviderId))?.baseUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                min="0"
                max="1000"
                placeholder="100"
              />
              <p className="text-sm text-gray-500">数值越高优先级越高（0-1000）</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enabled">在此分组中的状态</Label>
              <Select value={isEnabled} onValueChange={setIsEnabled}>
                <SelectTrigger id="enabled">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onClose()}>
                取消
              </Button>
              <Button type="submit" disabled={submitting || !selectedProviderId}>
                {submitting ? '添加中...' : '添加'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
