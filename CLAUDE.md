# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

Before introducing a library or framework:

- Verify the latest version using Context7 or search tools
- Read documentation via Context7, fallback to official docs via search
- Always use current APIs, avoid deprecated patterns
- Start with minimal working examples, add features incrementally
- Test after modifications to prevent regressions

## Commands

### Development

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm type-check   # Run TypeScript type checking (important before commits)
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix ESLint issues
pnpm format       # Format code with Prettier
```

### Database (Drizzle ORM)

```bash
pnpm db:generate  # Generate migration files from schema changes
pnpm db:push      # Apply migrations to database
pnpm db:studio    # Open Drizzle Studio (database GUI)
pnpm db:migrate   # Run migrations programmatically
```

### Known Issues

- **@esbuild-kit deprecation warnings**: During `pnpm install`, you may see warnings about `@esbuild-kit/core-utils` and `@esbuild-kit/esm-loader`. These are upstream dependencies from `drizzle-kit` (v0.31.5). This is a known issue tracked in [drizzle-kit#4852](https://github.com/drizzle-team/drizzle-kit-mirror/issues/4852) with PR [#4430](https://github.com/drizzle-team/drizzle-kit-mirror/pull/4430) to migrate to `tsx`. These warnings do not affect functionality.

## Project Architecture

This is an **API proxy polling system** - a high-availability API aggregation and load balancing system built with:

- **Next.js 15** (App Router) - Full-stack React framework
- **Drizzle ORM** - Type-safe ORM for PostgreSQL
- **Redis (ioredis)** - Caching and rate limiting
- **NextAuth.js v5** - Authentication
- **Tailwind CSS 4** - CSS framework (uses CSS-first configuration)
- **shadcn/ui** - UI component library (built on Radix UI)

### Core Purpose

The system intelligently routes API requests across multiple providers (with identical interface formats) to improve availability and performance through:

1. **Weighted round-robin polling** with dynamic health-based adjustments
2. **Automatic health checks** (passive monitoring from actual requests)
3. **Failure handling** with retry logic and automatic failover
4. **Rate limiting** and API key management
5. **Admin dashboard** for provider/group configuration and monitoring

### Key Architecture Patterns

**Three-tier data access**:

- **API Keys**: Global keys (access all groups) or group-specific keys
- **Groups**: Collections of providers with shared access keys
- **Providers**: Individual API endpoints with credentials

**Caching strategy** (Redis):

- Endpoint health status (5min TTL)
- Group endpoint lists (5min TTL)
- Dynamic polling weights (1min TTL)
- Rate limit counters (time-window based)
- Performance statistics (7 days)

**Request flow**:

1. Client → API proxy endpoint `/api/proxy/{groupName}`
2. Validate API key → Check rate limits
3. Select provider via weighted algorithm (considers health, response time, success rate)
4. Forward request with provider's credentials
5. Update health metrics in Redis
6. Return response with metadata headers

## Technology-Specific Notes

### shadcn/ui (Component Library)

⚠️ **IMPORTANT**: shadcn/ui is NOT a traditional npm package

- **CLI-based**: Components are copied directly into your project via CLI
- **Full ownership**: You own the component code and can modify freely
- **Built on Radix UI**: All components use Radix UI primitives for accessibility
- **Installation**: Use `npx shadcn@latest add <component-name>` to add components
- **Configuration**: `components.json` at project root controls CLI behavior
- **Location**: Components are added to `components/ui/` directory

Common commands:

```bash
npx shadcn@latest add button       # Add specific component
npx shadcn@latest add button dialog # Add multiple components
npx shadcn@latest add              # Interactive component picker
```

**Key Benefits**:

- Complete customization freedom (you own the code)
- No runtime dependency overhead
- Copy-paste friendly for modifications
- Tailwind CSS integration out of the box

### Next.js 15

- **Server Components** are default - use `'use client'` only when needed (hooks, events, browser APIs)
- **Server Actions** require `'use server'` directive - always validate auth and input
- **App Router**: Pages in `app/`, API routes in `app/api/`, layouts for shared UI
- Configuration file: `next.config.ts` (TypeScript, not .mjs)

### Tailwind CSS 4 (Breaking Change)

⚠️ **IMPORTANT**: Tailwind v4 uses CSS-first configuration

- **NO `tailwind.config.js`** - configuration is in `app/globals.css` using `@theme` directive
- PostCSS uses `@tailwindcss/postcss` plugin (not `tailwindcss`)
- Custom theme values defined as CSS variables in `@theme { }` block
- See `app/globals.css` for theme customization examples

### Drizzle ORM Best Practices

- Use **identity columns** instead of serial: `integer('id').primaryKey().generatedAlwaysAsIdentity()`
- Schemas in `schema/` directory
- Use `date` mode for timestamps (10-15% faster than string mode)
- Always use prepared statements for frequently executed queries
- Add indexes on frequently queried columns

### Redis (ioredis)

- Single Redis instance in `lib/redis.ts` (singleton pattern)
- Auto-pipelining enabled for performance
- Use `RedisKeys` helper from `lib/redis-keys.ts` for consistent key naming
- Always set TTL to prevent memory leaks
- Use Redis transactions (`multi()/exec()`) for atomic operations

### Authentication

- NextAuth.js v5 with session-based JWT strategy
- **Data Access Layer (DAL)** pattern required (see `lib/dal.ts`)
- ⚠️ **Security**: Never rely on middleware alone for auth (CVE-2025-29927)
- Always validate authentication in Server Components, Server Actions, and API Routes

## File Structure

```
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth route group (login, register)
│   ├── admin/              # Admin dashboard
│   │   ├── providers/      # Provider management
│   │   ├── groups/         # Group management
│   │   └── api-keys/       # API key management
│   ├── api/                # API Routes
│   │   ├── proxy/[group]/  # Main proxy endpoint
│   │   └── admin/          # Admin APIs
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Tailwind v4 config (CSS-first)
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── providers/          # Provider-related components
│   └── shared/             # Shared components
├── lib/                    # Utilities and core logic
│   ├── db.ts               # Database connection (Drizzle)
│   ├── redis.ts            # Redis connection
│   ├── redis-keys.ts       # Redis key naming helpers
│   ├── dal.ts              # Data Access Layer (auth wrapper)
│   ├── proxy.ts            # Proxy logic and polling algorithm
│   ├── auth.ts             # NextAuth.js configuration
│   ├── utils.ts            # General utilities (cn(), etc.)
│   └── validations.ts      # Zod schemas
├── schema/                 # Drizzle ORM schemas
│   ├── providers.ts
│   ├── groups.ts
│   ├── group-providers.ts
│   ├── api-keys.ts
│   ├── users.ts
│   └── index.ts
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
└── middleware.ts           # Next.js middleware (route protection)
```

## Important Patterns

### Polling Algorithm (lib/proxy.ts)

The weighted round-robin algorithm considers:

- Base priority (configured per provider)
- Health status bonus (+20 healthy, +10 degraded, 0 unhealthy)
- Success rate bonus (0-20 points based on percentage)
- Response time penalty (slower = higher penalty)
- Failure count penalty

Health status updated passively after each request. Unhealthy providers (5+ consecutive failures) are excluded from selection.

### Health Check Pattern

```typescript
// After each proxy request, update health in Redis:
await updateEndpointHealth(providerId, success, responseTime, error)

// Health affects next provider selection via weight calculation
```

### Rate Limiting Pattern

```typescript
// Sliding window rate limiting in Redis:
const key = `ratelimit:${apiKeyId}:${window}`
redis.incr(key) // Atomic increment
redis.pexpire(key, windowMs)
```

## Documentation References

For detailed information:

- **Product Requirements**: See `API-PROXY-PRD.md`
- **Code Standards**: See `CODE-STANDARDS.md`
- **Setup Instructions**: See `README.md`

## Critical Security Notes

1. **Never rely on middleware alone** for authentication (CVE-2025-29927)
2. Always use **Data Access Layer** functions that enforce auth checks
3. Encrypt sensitive data (API keys) in database using `lib/encryption.ts`
4. Validate all inputs with Zod schemas
5. Set appropriate CORS, CSP, and security headers
