from flask import Blueprint

from app.controllers.refund_controller import (
    create_refund,
    get_refunds,
    get_refund,
    approve_refund,
    reject_refund
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


refund_bp = Blueprint(
    "refund",
    __name__
)


@refund_bp.route(
    "/",
    methods=["POST"]
)
@jwt_auth_required
@role_required("user")
def store():

    return create_refund()


@refund_bp.route(
    "/",
    methods=["GET"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def index():

    return get_refunds()


@refund_bp.route(
    "/<int:id>",
    methods=["GET"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager",
    "user"
)
def show(id):

    return get_refund(id)


@refund_bp.route(
    "/<int:id>/approve",
    methods=["POST"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def approve(id):

    return approve_refund(id)


@refund_bp.route(
    "/<int:id>/reject",
    methods=["POST"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def reject(id):

    return reject_refund(id)
