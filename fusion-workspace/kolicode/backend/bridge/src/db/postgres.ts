import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export interface ServiceHealthStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs: number | null;
  details?: string;
}

let pool: Pool | null = null;

function getDatabaseUrl(): string {
  const hasStructuredConfig =
    process.env.POSTGRES_HOST ||
    process.env.POSTGRES_PORT ||
    process.env.POSTGRES_DB ||
    process.env.POSTGRES_USER ||
    process.env.POSTGRES_PASSWORD;

  if (hasStructuredConfig) {
    const host = process.env.POSTGRES_HOST ?? '127.0.0.1';
    const port = process.env.POSTGRES_PORT ?? '5433';
    const database = process.env.POSTGRES_DB ?? 'kolicode';
    const user = process.env.POSTGRES_USER ?? 'kolicode';
    const password = process.env.POSTGRES_PASSWORD ?? 'kolicode_dev_pass';

    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return process.env.DATABASE_URL ?? 'postgresql://kolicode:kolicode_dev_pass@127.0.0.1:5433/kolicode';
}

export function getPostgresPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, params);
}

export async function withPostgresClient<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresPool().connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function checkPostgresHealth(): Promise<ServiceHealthStatus> {
  const startedAt = Date.now();

  try {
    await queryPostgres('SELECT 1');

    return {
      status: 'healthy',
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - startedAt,
      details: error instanceof Error ? error.message : 'Unknown PostgreSQL error',
    };
  }
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}
