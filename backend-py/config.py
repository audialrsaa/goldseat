
import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY")

    # ==========================
    # DATABASE SUPABASE
    # ==========================

    SQLALCHEMY_DATABASE_URI = URL.create(
        drivername="postgresql+psycopg2",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        database=os.getenv("DB_NAME"),
        query={"sslmode": "require"}
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ==========================
    # SUPABASE STORAGE
    # ==========================

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")

    # ==========================
    # JWT
    # ==========================

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # ==========================
    # MIDTRANS
    # ==========================

    MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY")
    MIDTRANS_CLIENT_KEY = os.getenv("MIDTRANS_CLIENT_KEY")

    MIDTRANS_IS_PRODUCTION = (
        os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"
    )
