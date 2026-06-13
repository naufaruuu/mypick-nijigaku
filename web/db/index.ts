import 'server-only';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dbEnv } from './env';
import * as schema from './schema';

type DB = PostgresJsDatabase<typeof schema>;

// Lazily create the connection on first use (so importing this module during
// build doesn't read env / open a socket). Reused across hot-reloads in dev.
const g = globalThis as unknown as { _sql?: ReturnType<typeof postgres>; _db?: DB };

export function getDb(): DB {
  if (!g._db) {
    const sql = g._sql ?? postgres(dbEnv());
    g._sql = sql;
    g._db = drizzle(sql, { schema });
  }
  return g._db;
}
