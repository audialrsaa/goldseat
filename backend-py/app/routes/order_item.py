from flask import Blueprint

from app.controllers.order_item_controller import (
    create_order_item,
    get_order_items,
    get_order_items_by_order,
    get_order_item,
    update_order_item,
    delete_order_item
)


order_item_bp = Blueprint(
    "order_item",
    __name__
)


# =========================================================
# CREATE
# =========================================================

order_item_bp.route(
    "/",
    methods=["POST"]
)(
    create_order_item
)


# =========================================================
# GET ALL
# =========================================================

order_item_bp.route(
    "/",
    methods=["GET"]
)(
    get_order_items
)


# =========================================================
# GET BY ORDER
# =========================================================

order_item_bp.route(
    "/order/<int:order_id>",
    methods=["GET"]
)(
    get_order_items_by_order
)


# =========================================================
# GET DETAIL
# =========================================================

order_item_bp.route(
    "/<int:id>",
    methods=["GET"]
)(
    get_order_item
)


# =========================================================
# UPDATE
# =========================================================

order_item_bp.route(
    "/<int:id>",
    methods=["PUT"]
)(
    update_order_item
)


# =========================================================
# DELETE
# =========================================================

order_item_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)(
    delete_order_item
)