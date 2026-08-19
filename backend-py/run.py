from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

from config import Config
from app.extensions import db, bcrypt, jwt

# Import semua model via __init__
# agar Alembic dapat mendeteksi semua perubahan.
import app.models  # noqa: F401

# Semua routes
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

app = Flask(__name__)

app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)

Migrate(app, db)
CORS(app)


@app.route("/")
def home():
    return {
        "status": "success",
        "message": "GoldSeat API berhasil jalan"
    }


app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(artist_bp, url_prefix="/api/artists")
app.register_blueprint(venue_bp, url_prefix="/api/venues")
app.register_blueprint(event_bp, url_prefix="/api/events")
app.register_blueprint(ticket_category_bp, url_prefix="/api/ticket-categories")
app.register_blueprint(seat_bp, url_prefix="/api/seats")
app.register_blueprint(voucher_bp, url_prefix="/api/vouchers")
app.register_blueprint(order_bp, url_prefix="/api/orders")
app.register_blueprint(order_item_bp, url_prefix="/api/order-items")
app.register_blueprint(payment_bp, url_prefix="/api/payments")
app.register_blueprint(ticket_bp, url_prefix="/api/tickets")
app.register_blueprint(ticket_transfer_bp, url_prefix="/api/ticket-transfers")
app.register_blueprint(refund_bp, url_prefix="/api/refunds")


if __name__ == "__main__":
    app.run(debug=True)
