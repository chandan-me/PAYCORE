from typing import AsyncGenerator
import pymysql
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

def ensure_mysql_db():
    """Ensure the target MySQL database exists before SQLAlchemy initializes in dev/test."""
    db_url = settings.DATABASE_URL
    if "mysql" in db_url:
        try:
            from urllib.parse import urlparse
            cleaned = db_url.replace("mysql+aiomysql://", "mysql://").replace("mysql+asyncmy://", "mysql://").replace("mysql+pymysql://", "mysql://")
            parsed = urlparse(cleaned)
            dbname = parsed.path.lstrip('/') or 'paycore'
            user = parsed.username or 'root'
            password = parsed.password or ''
            host = parsed.hostname or 'localhost'
            port = parsed.port or 3306

            # Connect to MySQL server without database to create if missing
            con = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                autocommit=True
            )
            with con.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            con.close()
        except Exception as e:
            if settings.DEBUG:
                print(f"[MySQL Init Notice] Database auto-check: {e}")

# Run database check
ensure_mysql_db()

# Configure engine options
engine_kwargs = {
    "echo": False,
    "future": True
}

if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production connection pool parameters for MySQL
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
