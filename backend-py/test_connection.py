
from sqlalchemy import create_engine, text
from config import Config

try:
    engine = create_engine(
        Config.SQLALCHEMY_DATABASE_URI,
        pool_pre_ping=True
    )

    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT version()")
        )

        print("Koneksi Supabase berhasil!")
        print(result.scalar())

except Exception as e:
    print("Koneksi Supabase gagal!")
    print(e)
