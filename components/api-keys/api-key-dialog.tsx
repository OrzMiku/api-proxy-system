'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiKeyForm } from './api-key-form'
import { type ApiKeyInput } from '@/lib/validations'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

type ApiKey = {
  id: number
  name: string
  key: string
  description?: string | null
  groupId?: number | null
  isEnabled: boolean
  rateLimit: number
  expiresAt?: Date | null
}

type ApiKeyDialogProps = {
  open: boolean
  onClose: (success?: boolean) => void
  apiKey?: ApiKey | null
}

export function ApiKeyDialog({ open, onClose, apiKey }: ApiKeyDialogProps) {
  const [apiKeyData, setApiKeyData] = useState<ApiKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isEdit = !!apiKey

  useEffect(() => {
    if (open && apiKey) {
      // Fetch full API key data for editing
      setLoading(true)
      fetch(`/api/admin/api-keys/${apiKey.id}`)
        .then((res) => res.json())
        .then((data) => {
          setApiKeyData(data.apiKey)
        })
        .catch((error) => {
          console.error('Failed to fetch API key:', error)
          toast.error('加载 API Key 数据失败')
        })
        .finally(() => setLoading(false))
    } else {
      setApiKeyData(null)
      setNewlyCreatedKey(null)
    }
  }, [open, apiKey])

  const handleSubmit = async (data: ApiKeyInput) => {
    try {
      const url = isEdit ? `/api/admin/api-keys/${apiKey.id}` : '/api/admin/api-keys'
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
        throw new Error(error.error || 'Failed to save API key')
      }

      const result = await response.json()

      if (!isEdit && result.apiKey.key) {
        // Store the newly created key to display it
        setNewlyCreatedKey(result.apiKey.key)
        toast.success('API Key 已创建！请复制并保存，此密钥只显示一次。')
      } else {
        toast.success(isEdit ? 'API Key 已更新' : 'API Key 已创建')
        onClose(true)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
      throw error
    }
  }

  const handleCopyKey = async () => {
    if (!newlyCreatedKey) return

    try {
      await navigator.clipboard.writeText(newlyCreatedKey)
      setCopied(true)
      toast.success('API Key 已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  const handleClose = () => {
    if (newlyCreatedKey) {
      if (confirm('确定要关闭吗？API Key 只显示一次，关闭后将无法再次查看。')) {
        setNewlyCreatedKey(null)
        onClose(true)
      }
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 API Key' : '新增 API Key'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改 API Key 配置信息（无法修改密钥本身）' : '创建一个新的 API 访问密钥'}
          </DialogDescription>
        </DialogHeader>

        {newlyCreatedKey ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>重要提示：</strong>请立即复制并保存此 API
                Key，关闭此对话框后将无法再次查看。
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">您的 API Key</label>
              <div className="flex gap-2">
                <code className="flex-1 rounded bg-gray-100 p-3 font-mono text-sm break-all dark:bg-gray-800">
                  {newlyCreatedKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => handleClose()}>我已复制，关闭</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-gray-500">加载中...</div>
        ) : (
          <ApiKeyForm
            defaultValues={
              apiKeyData
                ? {
                    name: apiKeyData.name,
                    description: apiKeyData.description || undefined,
                    groupId: apiKeyData.groupId || undefined,
                    isEnabled: apiKeyData.isEnabled,
                    rateLimit: apiKeyData.rateLimit,
                    expiresAt: apiKeyData.expiresAt || undefined,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            submitLabel={isEdit ? '更新' : '创建'}
            isEdit={isEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
