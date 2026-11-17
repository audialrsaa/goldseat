
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

from config import Config
from app.extensions import db, bcrypt, jwt

# Import semua model agar Alembic dapat mendeteksi perubahan.
import app.models  # noqa: F401

# Import semua routes.
from app.routes.auth import auth_bp
from app.routes.artist import artist_bp
from app.routes.venue import venue_bp
from app.routes.event import event_bp
from app.routes.ticket_category import ticket_category_bp
from app.routes.seat import seat_bp
from app.routes.voucher import voucher_bp
from app.routes.order import order_bp
from app.routes.order_item import order_item_bp
from app.routes.payment import payment_bp
from app.routes.ticket import ticket_bp
from app.routes.ticket_transfer import ticket_transfer_bp
from app.routes.refund import refund_bp
from app.routes.dashboard import dashboard_bp
from app.routes.user import user_bp
from app.routes.event_category import event_category_bp
from app.routes.banner import banner_bp


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

app.config.from_object(Config)

# Izinkan route menggunakan URL dengan atau tanpa trailing slash.
# Contoh: /api/events dan /api/events/
app.url_map.strict_slashes = False


# =========================================================
# CORS CONFIGURATION
# =========================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization",
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
        }
    },
)


# =========================================================
# INITIALIZE EXTENSIONS
# =========================================================

db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)

Migrate(app, db)


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/")
def home():
    return {
        "status": "success",
        "message": "GoldSeat API berhasil jalan",
    }


# =========================================================
# REGISTER BLUEPRINTS
# =========================================================

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(artist_bp, url_prefix="/api/artists")
app.register_blueprint(venue_bp, url_prefix="/api/venues")
app.register_blueprint(event_bp, url_prefix="/api/events")
app.register_blueprint(
    ticket_category_bp,
    url_prefix="/api/ticket-categories",
)
app.register_blueprint(seat_bp, url_prefix="/api/seats")
app.register_blueprint(voucher_bp, url_prefix="/api/vouchers")
app.register_blueprint(order_bp, url_prefix="/api/orders")
app.register_blueprint(order_item_bp, url_prefix="/api/order-items")
app.register_blueprint(payment_bp, url_prefix="/api/payments")
app.register_blueprint(ticket_bp, url_prefix="/api/tickets")
app.register_blueprint(
    ticket_transfer_bp,
    url_prefix="/api/ticket-transfers",
)
app.register_blueprint(refund_bp, url_prefix="/api/refunds")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(user_bp, url_prefix="/api/admin/users")
app.register_blueprint(
    event_category_bp,
    url_prefix="/api/admin/event-categories",
)
app.register_blueprint(
    banner_bp,
    url_prefix="/api/admin/banners",
)


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)
