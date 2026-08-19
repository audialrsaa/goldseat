from flask import Blueprint

from app.controllers.artist_controller import (
    create_artist,
    get_artists,
    get_artist,
    update_artist,
    delete_artist
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


artist_bp = Blueprint(
    "artist",
    __name__
)


@artist_bp.route("/", methods=["POST"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def store():
    return create_artist()


@artist_bp.route("/", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def index():
    return get_artists()


@artist_bp.route("/<int:id>", methods=["GET"])
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def show(id):
    return get_artist(id)


@artist_bp.route("/<int:id>", methods=["PUT", "PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def update(id):
    return update_artist(id)


@artist_bp.route("/<int:id>", methods=["DELETE"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def destroy(id):
    return delete_artist(id)