from flask import Blueprint

from app.controllers.voucher_controller import (
    create_voucher,
    get_vouchers,
    get_voucher,
    update_voucher,
    delete_voucher
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


voucher_bp = Blueprint(
    "voucher",
    __name__
)


# ==========================
# GET ALL
# ==========================

@voucher_bp.route(
    "/",
    methods=["GET"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def index():

    return get_vouchers()


# ==========================
# GET DETAIL
# ==========================

@voucher_bp.route(
    "/<int:id>",
    methods=["GET"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def show(id):

    return get_voucher(id)


# ==========================
# CREATE
# ==========================

@voucher_bp.route(
    "/",
    methods=["POST"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def store():

    return create_voucher()


# ==========================
# UPDATE
# ==========================

@voucher_bp.route(
    "/<int:id>",
    methods=["PUT"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def update(id):

    return update_voucher(id)


# ==========================
# DELETE
# ==========================

@voucher_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def destroy(id):

    return delete_voucher(id)