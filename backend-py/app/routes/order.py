from flask import Blueprint

from app.controllers.order_controller import (
    get_orders,
    get_my_orders,
    get_order,
    create_order,
    cancel_order,
    update_order,
    delete_order,
)

order_bp = Blueprint("order", __name__)

order_bp.add_url_rule(
    "",
    view_func=get_orders,
    methods=["GET"],
)

order_bp.add_url_rule(
    "/my",
    view_func=get_my_orders,
    methods=["GET"],
)

order_bp.add_url_rule(
    "",
    view_func=create_order,
    methods=["POST"],
)

order_bp.add_url_rule(
    "/<int:id>",
    view_func=get_order,
    methods=["GET"],
)

order_bp.add_url_rule(
    "/<int:id>",
    view_func=update_order,
    methods=["PUT"],
)

order_bp.add_url_rule(
    "/<int:id>/cancel",
    view_func=cancel_order,
    methods=["PATCH"],
)

order_bp.add_url_rule(
    "/<int:id>",
    view_func=delete_order,
    methods=["DELETE"],
)