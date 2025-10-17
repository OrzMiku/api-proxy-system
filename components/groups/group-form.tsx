'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { groupSchema, type GroupInput } from '@/lib/validations'
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

type GroupFormProps = {
  defaultValues?: Partial<GroupInput>
  onSubmit: (data: GroupInput) => Promise<void>
  submitLabel?: string
}

export function GroupForm({ defaultValues, onSubmit, submitLabel = '保存' }: GroupFormProps) {
  const form = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      slug: defaultValues?.slug || '',
      description: defaultValues?.description,
      isEnabled: defaultValues?.isEnabled ?? true,
      pollingStrategy: defaultValues?.pollingStrategy ?? 'weighted-round-robin',
      metadata: defaultValues?.metadata,
    },
  })

  const handleSubmit = async (data: GroupInput) => {
    try {
      await onSubmit(data)
      form.reset()
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
              <FormLabel>分组名称</FormLabel>
              <FormControl>
                <Input placeholder="例如: OpenAI Group" {...field} />
              </FormControl>
              <FormDescription>分组的显示名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL 标识)</FormLabel>
              <FormControl>
                <Input placeholder="例如: openai-group" {...field} />
              </FormControl>
              <FormDescription>
                用于 API 端点的唯一标识符，只能包含小写字母、数字和连字符
              </FormDescription>
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
                <Input placeholder="关于这个分组的说明" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pollingStrategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>轮询策略</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weighted-round-robin">加权轮询</SelectItem>
                  <SelectItem value="priority-failover">优先级故障转移</SelectItem>
                  <SelectItem value="least-connections">最少连接</SelectItem>
                  <SelectItem value="ip-hash">IP Hash</SelectItem>
                  <SelectItem value="random">随机</SelectItem>
                  <SelectItem value="round-robin">轮询</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>选择负载均衡策略</FormDescription>
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
