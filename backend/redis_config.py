import os
import redis
from dotenv import load_dotenv

load_dotenv()

# If REDIS_URL is set (e.g. on Render), use it; otherwise fall back to host/port/db
redis_url = os.getenv("REDIS_URL")
if redis_url:
    # Creates a client from the full URL (including TLS if using rediss://)
    redis_client = redis.from_url(redis_url, decode_responses=True)
else:
    # Legacy settings (localhost, .env, etc)
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB   = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True
    )

def test_redis_connection():
    try:
        redis_client.ping()
        print("Redis connection successful")
    except redis.ConnectionError as e:
        print(f"Redis connection failed: {str(e)}")
        raise
