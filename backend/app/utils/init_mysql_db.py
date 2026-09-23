import argparse
import os
import subprocess
import sys
import pymysql
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

def init_db():
    parser = argparse.ArgumentParser(description="Initialize PAYCORE MySQL Database & Run Migrations")
    parser.add_argument("--host", default=os.getenv("MYSQL_HOST", "localhost"), help="MySQL Host")
    parser.add_argument("--port", type=int, default=int(os.getenv("MYSQL_PORT", 3306)), help="MySQL Port")
    parser.add_argument("--user", default=os.getenv("MYSQL_USER", "root"), help="MySQL Username")
    parser.add_argument("--password", default=os.getenv("MYSQL_PASSWORD", "password"), help="MySQL Password")
    parser.add_argument("--database", default=os.getenv("MYSQL_DATABASE", "paycore"), help="Database Name")
    args = parser.parse_args()

    print(f"[*] Connecting to MySQL server at {args.host}:{args.port} as user '{args.user}'...")
    try:
        conn = pymysql.connect(
            host=args.host,
            port=args.port,
            user=args.user,
            password=args.password
        )
    except Exception as e:
        print(f"\n[!] Failed to connect to MySQL: {e}")
        print("\nPlease ensure:")
        print(f"  1. MySQL 8.0+ is running on {args.host}:{args.port}")
        print(f"  2. Your password for user '{args.user}' is correctly provided.")
        print(f"     Example: python -m app.utils.init_mysql_db --user {args.user} --password YOUR_MYSQL_PASSWORD")
        sys.exit(1)

    with conn.cursor() as cur:
        print(f"[*] Creating database '{args.database}' if not exists...")
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{args.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
    conn.close()
    print(f"[+] Database '{args.database}' is ready!")

    # Now run alembic migrations
    print("[*] Running Alembic migrations to create tables and indexes...")
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    try:
        res = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True
        )
        if res.returncode == 0:
            print("[+] Alembic migrations applied successfully!")
            print(res.stdout)
        else:
            print("[!] Alembic migration notice:")
            print(res.stdout)
            print(res.stderr)
    except Exception as e:
        print(f"[!] Migration runner error: {e}")

if __name__ == "__main__":
    init_db()
