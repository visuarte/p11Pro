import redis
from tenacity import retry, wait_exponential, stop_after_attempt, before_sleep_log
import logging

logger = logging.getLogger("RedisClient")

@retry(wait=wait_exponential(multiplier=1, min=1, max=30), stop=stop_after_attempt(5), before_sleep=before_sleep_log(logger, logging.WARNING))
def get_redis_client():
    client = redis.Redis(
        host='localhost',
        port=6379,
        password=None,
        socket_connect_timeout=5
    )
    # Test connection
    client.ping()
    logger.info("Redis connection established")
    return client

redis_client = get_redis_client()

