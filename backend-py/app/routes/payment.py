from flask import Blueprint

from app.controllers.payment.payment_controller import (
    create_payment,
    payment_notification,
    get_payments,
    transaction_status,
)


payment_bp = Blueprint(
    "payment",
    __name__
)


# =========================================================
# GET ALL PAYMENTS - SUPER ADMIN
# =========================================================

@payment_bp.route(
    "",
    methods=["GET"]
)
def get_payments_route():
    return get_payments()


# =========================================================
# CREATE PAYMENT
# =========================================================

@payment_bp.route(
    "/create",
    methods=["POST"]
)
def create_payment_route():
    return create_payment()


# =========================================================
# MIDTRANS NOTIFICATION
# =========================================================

@payment_bp.route(
    "/notification",
    methods=["POST"]
)
def payment_notification_route():
    return payment_notification()


# =========================================================
# GET TRANSACTION STATUS
# =========================================================

@payment_bp.route(
    "/status",
    methods=["GET", "POST"]
)
def transaction_status_route():
    return transaction_status()
