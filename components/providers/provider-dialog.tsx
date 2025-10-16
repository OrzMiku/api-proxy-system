'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProviderForm } from './provider-form'
import { type ProviderInput } from '@/lib/validations'
import { toast } from 'sonner'

type Provider = {
  id: number
  name: string
  baseUrl: string
  apiKey?: string | null
  description?: string | null
  isEnabled: boolean
  priority: number
  timeout: number
}

type ProviderDialogProps = {
  open: boolean
  onClose: (success?: boolean) => void
  provider?: Provider | null
}

export function ProviderDialog({ open, onClose, provider }: ProviderDialogProps) {
  const [providerData, setProviderData] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(false)

  const isEdit = !!provider

  useEffect(() => {
    if (open && provider) {
      // Fetch full provider data including API key
      setLoading(true)
      fetch(`/api/admin/providers/${provider.id}`)
        .then((res) => res.json())
        .then((data) => {
          setProviderData(data.provider)
        })
        .catch((error) => {
          console.error('Failed to fetch provider:', error)
          toast.error('加载提供商数据失败')
        })
        .finally(() => setLoading(false))
    } else {
      setProviderData(null)
    }
  }, [open, provider])

  const handleSubmit = async (data: ProviderInput) => {
    try {
      const url = isEdit ? `/api/admin/providers/${provider.id}` : '/api/admin/providers'
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
        throw new Error(error.error || 'Failed to save provider')
      }

      toast.success(isEdit ? '提供商已更新' : '提供商已创建')
      onClose(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑提供商' : '新增提供商'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改提供商配置信息' : '添加一个新的 API 提供商'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">加载中...</div>
        ) : (
          <ProviderForm
            defaultValues={
              providerData
                ? {
                    name: providerData.name,
                    baseUrl: providerData.baseUrl,
                    apiKey: providerData.apiKey || undefined,
                    description: providerData.description || undefined,
                    isEnabled: providerData.isEnabled,
                    priority: providerData.priority,
                    timeout: providerData.timeout,
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
