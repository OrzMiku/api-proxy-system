'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiKeySchema, type ApiKeyInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Group = {
  id: number
  name: string
  slug: string
}

type ApiKeyFormProps = {
  defaultValues?: Partial<ApiKeyInput>
  onSubmit: (data: ApiKeyInput) => Promise<void>
  submitLabel?: string
  isEdit?: boolean
}

export function ApiKeyForm({
  defaultValues,
  onSubmit,
  submitLabel = '保存',
  isEdit = false,
}: ApiKeyFormProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)

  const form = useForm<ApiKeyInput>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description,
      groupId: defaultValues?.groupId,
      isEnabled: defaultValues?.isEnabled ?? true,
      rateLimit: defaultValues?.rateLimit ?? 100,
      expiresAt: defaultValues?.expiresAt,
    },
  })

  useEffect(() => {
    // Fetch groups for selection
    const fetchGroups = async () => {
      setLoadingGroups(true)
      try {
        const response = await fetch('/api/admin/groups')
        if (response.ok) {
          const data = await response.json()
          setGroups(data.groups)
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error)
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [])

  const handleSubmit = async (data: ApiKeyInput) => {
    try {
      await onSubmit(data)
      if (!isEdit) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key 名称</FormLabel>
              <FormControl>
                <Input placeholder="例如: Production Key" {...field} />
              </FormControl>
              <FormDescription>用于识别此 API Key 的友好名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述 (可选)</FormLabel>
              <FormControl>
                <Input
                  placeholder="关于这个 API Key 的说明"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>关联分组 (可选)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'global' ? undefined : parseInt(value))}
                defaultValue={field.value ? field.value.toString() : 'global'}
                disabled={loadingGroups}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分组或使用全局" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="global">全局 Key (所有分组)</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name} ({group.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                全局 Key 可访问所有分组，分组 Key 只能访问指定分组
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rateLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>速率限制 (请求/分钟)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  min="1"
                  max="100000"
                />
              </FormControl>
              <FormDescription>每分钟允许的最大请求数</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>过期时间 (可选)</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={
                    field.value
                      ? new Date(field.value).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormDescription>留空表示永不过期</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状态</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'true')}
                defaultValue={field.value ? 'true' : 'false'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">禁用</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '保存中...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
