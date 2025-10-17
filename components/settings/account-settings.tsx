'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

type UserInfo = {
  id: string
  username: string
  email?: string | null
  name?: string | null
  role: string
}

type AccountSettingsProps = {
  user: UserInfo
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!currentPassword) {
      toast.error('Current password is required')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword && newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (!newUsername && !newPassword) {
      toast.error('Please provide new username or new password')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/settings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Update failed')
      }

      toast.success('Account updated successfully. Please login again.')

      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
      console.error(error)
      setSaving(false)
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>账户安全</CardTitle>
        </div>
        <CardDescription>更新您的登录凭据</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentUsername">当前用户名</Label>
            <Input id="currentUsername" value={user.username} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newUsername">新用户名 (可选)</Label>
            <Input
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="留空以保留当前用户名"
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                当前密码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="用于验证"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码 (可选)</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="留空以保留当前密码"
              minLength={8}
            />
            {newPassword && <p className="text-xs text-gray-500">至少 8 个字符</p>}
          </div>

          {newPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                确认新密码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
