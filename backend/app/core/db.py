import os
from dbutils.pooled_db import PooledDB
import pymysql

_pool: PooledDB | None = None


def get_pool() -> PooledDB:
    global _pool
    if _pool is None:
        _pool = PooledDB(
            creator=pymysql,
            maxconnections=int(os.getenv("MYSQL_POOL_SIZE", "10")),
            mincached=2,
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "corob"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "corob_service"),
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True,
        )
    return _pool


def get_connection():
    return get_pool().connection()
