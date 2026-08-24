import psycopg2

def check():
    try:
        con = psycopg2.connect(
            dbname='paycore',
            user='postgres',
            password='chandan475219',
            host='localhost',
            port=5432
        )
        cur = con.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
        tables = cur.fetchall()
        print("=== PAYCORE POSTGRESQL DATABASE TABLES ===")
        for t in tables:
            t_name = t[0]
            cur.execute(f'SELECT COUNT(*) FROM "{t_name}";')
            cnt = cur.fetchone()[0]
            print(f"  • {t_name:<25} ({cnt} rows)")
        cur.close()
        con.close()
    except Exception as e:
        print("Error checking PostgreSQL db:", e)

if __name__ == "__main__":
    check()
