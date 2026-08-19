from flask import Blueprint

from app.controllers.venue_controller import (
    create_venue,
    get_venues,
    get_venue,
    update_venue,
    delete_venue
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


venue_bp = Blueprint(
    "venue",
    __name__
)


@venue_bp.route("/", methods=["POST"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def store():
    return create_venue()


@venue_bp.route("/", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def index():
    return get_venues()


@venue_bp.route("/<int:id>", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def show(id):
    return get_venue(id)


@venue_bp.route("/<int:id>", methods=["PUT", "PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def update(id):
    return update_venue(id)


@venue_bp.route("/<int:id>", methods=["DELETE"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def destroy(id):
    return delete_venue(id)