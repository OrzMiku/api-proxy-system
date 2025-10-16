import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './schema/**/*.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
  verbose: true,
  strict: true,
})
