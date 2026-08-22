import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

async def main():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    rows = await conn.fetch("SELECT id, code, name FROM companies")
    print(f"Companies count: {len(rows)}")
    for row in rows:
        print(dict(row))
    await conn.close()

asyncio.run(main())
