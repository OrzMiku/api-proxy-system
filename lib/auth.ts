import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'

/**
 * NextAuth.js v5 configuration
 * Implements credential-based authentication with session management
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          // Lazy load logger only when needed
          const { logger } = await import('@/lib/logger')
          logger.warn('Login attempt with missing credentials')
          return null
        }

        try {
          // Lazy load database and schema only in server context (not in edge runtime)
          const { db } = await import('@/lib/db')
          const { users } = await import('@/schema')
          const { compare } = await import('@/lib/encryption')
          const { logger } = await import('@/lib/logger')

          // Find user by username
          const [user] = await db
            .select({
              id: users.id,
              username: users.username,
              email: users.email,
              name: users.name,
              role: users.role,
              passwordHash: users.passwordHash,
            })
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1)

          if (!user) {
            logger.warn({ username: credentials.username }, 'Login attempt for non-existent user')
            return null
          }

          // Verify password
          const isValid = await compare(credentials.password as string, user.passwordHash)

          if (!isValid) {
            logger.warn(
              { userId: user.id, username: user.username },
              'Login attempt with invalid password'
            )
            return null
          }

          logger.info({ userId: user.id, username: user.username }, 'User logged in successfully')

          // Return user object (without password hash)
          return {
            id: user.id.toString(),
            name: user.name || user.username,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          const { logger } = await import('@/lib/logger')
          logger.error({ err: error }, 'Error during authentication')
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token on sign in
      if (user) {
        token['id'] = user.id
        token['role'] = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Add user info to session
      if (token && session.user) {
        session.user.id = token['id'] as string
        session.user.role = token['role'] as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env['NEXTAUTH_SECRET'],
})

/**
 * Type augmentation for NextAuth
 * Adds custom fields to session and token types
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: string
    }
  }

  interface User {
    id: string
    role: string
  }

  interface JWT {
    id?: string
    role?: string
  }
}
