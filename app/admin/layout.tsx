'use client'

import { AdminNav } from '@/components/layout/admin-nav'
import { MobileNav } from '@/components/layout/mobile-nav'

/**
 * Admin layout - wraps all admin pages with navigation
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-white lg:block dark:bg-gray-950">
        <AdminNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>

        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
