'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Server,
  FolderKanban,
  Key,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: '仪表盘',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: '提供商管理',
    href: '/admin/providers',
    icon: Server,
  },
  {
    name: '分组管理',
    href: '/admin/groups',
    icon: FolderKanban,
  },
  {
    name: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
  },
  {
    name: '统计分析',
    href: '/admin/stats',
    icon: BarChart3,
  },
  {
    name: '设置',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Server className="h-6 w-6" />
          <span>API Proxy</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  )
}
