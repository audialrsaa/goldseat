import os
from dotenv import load_dotenv

load_dotenv()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY")

    # ==========================
    # DATABASE
    # ==========================

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:"
        f"{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:"
        f"{os.getenv('DB_PORT')}/"
        f"{os.getenv('DB_NAME')}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ==========================
    # JWT
    # ==========================

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY"
    )

    # ==========================
    # MIDTRANS
    # ==========================

    MIDTRANS_SERVER_KEY = os.getenv(
        "MIDTRANS_SERVER_KEY"
    )

    MIDTRANS_CLIENT_KEY = os.getenv(
        "MIDTRANS_CLIENT_KEY"
    )

    MIDTRANS_IS_PRODUCTION = (
        os.getenv(
            "MIDTRANS_IS_PRODUCTION",
            "false"
        ).lower() == "true"
    )