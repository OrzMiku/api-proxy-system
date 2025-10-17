'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GroupForm } from './group-form'
import { type GroupInput } from '@/lib/validations'
import { toast } from 'sonner'

type Group = {
  id: number
  name: string
  slug: string
  description?: string | null
  isEnabled: boolean
  pollingStrategy: string
  metadata?: string | null
}

type GroupDialogProps = {
  open: boolean
  onClose: (success?: boolean) => void
  group?: Group | null
}

export function GroupDialog({ open, onClose, group }: GroupDialogProps) {
  const [groupData, setGroupData] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)

  const isEdit = !!group

  useEffect(() => {
    if (open && group) {
      // Fetch full group data
      setLoading(true)
      fetch(`/api/admin/groups/${group.id}`)
        .then((res) => res.json())
        .then((data) => {
          setGroupData(data.group)
        })
        .catch((error) => {
          console.error('Failed to fetch group:', error)
          toast.error('加载分组数据失败')
        })
        .finally(() => setLoading(false))
    } else {
      setGroupData(null)
    }
  }, [open, group])

  const handleSubmit = async (data: GroupInput) => {
    try {
      const url = isEdit ? `/api/admin/groups/${group.id}` : '/api/admin/groups'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save group')
      }

      toast.success(isEdit ? '分组已更新' : '分组已创建')
      onClose(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑分组' : '新增分组'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改分组配置信息' : '添加一个新的提供商分组'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">加载中...</div>
        ) : (
          <GroupForm
            defaultValues={
              groupData
                ? {
                    name: groupData.name,
                    slug: groupData.slug,
                    description: groupData.description || undefined,
                    isEnabled: groupData.isEnabled,
                    pollingStrategy: groupData.pollingStrategy as GroupInput['pollingStrategy'],
                    metadata: groupData.metadata || undefined,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            submitLabel={isEdit ? '更新' : '创建'}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
