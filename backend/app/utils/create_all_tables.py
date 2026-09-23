import asyncio
from app.database import engine, Base
import app.models  # load all models

async def create_tables():
    print("[*] Creating all PAYCORE tables in MySQL...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] All tables successfully created in MySQL!")

if __name__ == "__main__":
    asyncio.run(create_tables())
