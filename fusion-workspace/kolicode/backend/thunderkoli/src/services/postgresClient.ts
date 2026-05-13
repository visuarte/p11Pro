import { Pool, PoolConfig } from 'pg';
// Logger utilitario, reemplaza por tu logger real si es necesario
const logger = console;

const config: PoolConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'kolicode',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

const pool = new Pool(config);

async function connectWithRetry(retries = 5, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      logger.info('PostgreSQL connection established');
      return;
    } catch (err: any) {
      logger.error(`PostgreSQL connection failed (attempt ${attempt}): ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, delay * attempt)); // Exponential backoff
    }
  }
}

connectWithRetry().catch(err => {
  logger.error('Could not connect to PostgreSQL after retries:', err);
  process.exit(1);
});

export default pool;

