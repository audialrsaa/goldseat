from flask import Blueprint

from app.controllers.event_category_controller import (
    get_event_categories,
    get_event_category,
    create_event_category,
    update_event_category,
    toggle_event_category_status,
    delete_event_category
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


event_category_bp = Blueprint(
    "event_category",
    __name__
)


@event_category_bp.route("/", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def index():
    return get_event_categories()


@event_category_bp.route("/<int:id>", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def show(id):
    return get_event_category(id)


@event_category_bp.route("/", methods=["POST"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def store():
    return create_event_category()


@event_category_bp.route("/<int:id>", methods=["PUT", "PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def update(id):
    return update_event_category(id)


@event_category_bp.route("/<int:id>/status", methods=["PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def toggle_status(id):
    return toggle_event_category_status(id)


@event_category_bp.route("/<int:id>", methods=["DELETE"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def destroy(id):
    return delete_event_category(id)