import { redirect } from 'next/navigation'
import { getSession } from '@/lib/dal'

/**
 * Home page - redirects to admin dashboard if authenticated, otherwise to login
 */
export default async function HomePage() {
  const session = await getSession()

  if (session) {
    redirect('/admin')
  }

  redirect('/login')
}
