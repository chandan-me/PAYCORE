import pymysql
from app.config import settings

def check_mysql():
    try:
        con = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE
        )
        with con.cursor() as cur:
            cur.execute("SHOW TABLES;")
            tables = cur.fetchall()
            print("=== PAYCORE MYSQL DATABASE TABLES ===")
            for t in tables:
                t_name = t[0]
                cur.execute(f"SELECT COUNT(*) FROM `{t_name}`;")
                cnt = cur.fetchone()[0]
                print(f"  • {t_name:<25} ({cnt} rows)")
        con.close()
    except Exception as e:
        print("MySQL check notice:", e)

if __name__ == "__main__":
    check_mysql()
