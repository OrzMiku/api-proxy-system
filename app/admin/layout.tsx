import { AdminNav } from '@/components/layout/admin-nav'

/**
 * Admin layout - wraps all admin pages with navigation
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-white dark:bg-gray-950 lg:block">
        <AdminNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
