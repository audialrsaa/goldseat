from flask import Blueprint

from app.controllers.order_controller import (
    get_orders,
    get_my_orders,
    get_order,
    create_order,
    cancel_order,
    update_order,
    delete_order
)


order_bp = Blueprint(
    "order",
    __name__
)


# =========================================================
# GET ALL ORDERS
# =========================================================

order_bp.route(
    "",
    methods=["GET"]
)(get_orders)


# =========================================================
# GET MY ORDERS
# =========================================================

order_bp.route(
    "/my",
    methods=["GET"]
)(get_my_orders)


# =========================================================
# CREATE ORDER
# =========================================================

order_bp.route(
    "",
    methods=["POST"]
)(create_order)


# =========================================================
# GET ORDER DETAIL
# =========================================================

order_bp.route(
    "/<int:id>",
    methods=["GET"]
)(get_order)


# =========================================================
# UPDATE ORDER
# =========================================================

order_bp.route(
    "/<int:id>",
    methods=["PUT"]
)(update_order)


# =========================================================
# CANCEL ORDER
# =========================================================

order_bp.route(
    "/<int:id>/cancel",
    methods=["PATCH"]
)(cancel_order)


# =========================================================
# DELETE ORDER
# =========================================================

order_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)(delete_order)