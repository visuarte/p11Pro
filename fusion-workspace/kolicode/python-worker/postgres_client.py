import psycopg2
from tenacity import retry, wait_exponential, stop_after_attempt, before_sleep_log
import logging

logger = logging.getLogger("PostgresClient")

@retry(wait=wait_exponential(multiplier=2, min=2, max=30), stop=stop_after_attempt(5), before_sleep=before_sleep_log(logger, logging.WARNING))
def get_postgres_conn():
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='',
        dbname='kolicode',
        connect_timeout=5
    )
    # Test connection
    with conn.cursor() as cur:
        cur.execute('SELECT 1')
    logger.info("PostgreSQL connection established")
    return conn

postgres_conn = get_postgres_conn()

