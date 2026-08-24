from typing import AsyncGenerator
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

def ensure_postgresql_db():
    """Ensure the target PostgreSQL database exists before SQLAlchemy initializes."""
    db_url = settings.DATABASE_URL
    if "postgresql" in db_url:
        try:
            # Extract host, port, user, password, dbname
            from urllib.parse import urlparse
            parsed = urlparse(db_url.replace("postgresql+asyncpg://", "postgresql://"))
            dbname = parsed.path.lstrip('/') or 'paycore'
            user = parsed.username or 'postgres'
            password = parsed.password or ''
            host = parsed.hostname or 'localhost'
            port = parsed.port or 5432

            # Connect to default postgres DB
            con = psycopg2.connect(dbname='postgres', user=user, password=password, host=host, port=port)
            con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = con.cursor()
            
            cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
            exists = cur.fetchone()
            if not exists:
                cur.execute(f'CREATE DATABASE "{dbname}"')
            cur.close()
            con.close()
        except Exception as e:
            print(f"[PostgreSQL Init Warning] Could not auto-create database: {e}")

# Run database existence check
ensure_postgresql_db()

# Create async database engine
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=connect_args,
    future=True
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
