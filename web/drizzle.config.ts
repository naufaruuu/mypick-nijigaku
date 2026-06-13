import { defineConfig } from 'drizzle-kit';
import { dbEnv } from './db/env';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { ...dbEnv(), ssl: false },
});
