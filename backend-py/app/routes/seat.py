from flask import Blueprint

from app.controllers.seat_controller import (
    get_seats,
    get_seat,
    create_seat,
    update_seat,
    delete_seat,
    lock_seat,
    unlock_seat
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


seat_bp = Blueprint(
    "seat",
    __name__
)


# =========================================================
# GET ALL
# =========================================================

@seat_bp.route(
    "/",
    methods=["GET"]
)
def index():

    return get_seats()


# =========================================================
# GET DETAIL
# =========================================================

@seat_bp.route(
    "/<int:id>",
    methods=["GET"]
)
def show(id):

    return get_seat(id)


# =========================================================
# CREATE
# =========================================================

@seat_bp.route(
    "/",
    methods=["POST"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def store():

    return create_seat()


# =========================================================
# UPDATE
# =========================================================

@seat_bp.route(
    "/<int:id>",
    methods=["PUT", "PATCH"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def update(id):

    return update_seat(id)


# =========================================================
# DELETE
# =========================================================

@seat_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def destroy(id):

    return delete_seat(id)


# =========================================================
# LOCK
# =========================================================

@seat_bp.route(
    "/<int:id>/lock",
    methods=["POST"]
)
@jwt_auth_required
@role_required("user")
def lock(id):

    return lock_seat(id)


# =========================================================
# UNLOCK
# =========================================================

@seat_bp.route(
    "/<int:id>/unlock",
    methods=["POST"]
)
@jwt_auth_required
@role_required("user")
def unlock(id):

    return unlock_seat(id)