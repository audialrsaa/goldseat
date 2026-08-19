from flask import Blueprint

from app.controllers.ticket_transfer_controller import (
    create_transfer,
    get_transfers,
    get_transfer,
    accept_transfer,
    cancel_transfer
)


ticket_transfer_bp = Blueprint(
    "ticket_transfer",
    __name__
)


# =========================================================
# CREATE
# =========================================================

@ticket_transfer_bp.route(
    "/",
    methods=["POST"]
)
def create():

    return create_transfer()


# =========================================================
# GET ALL
# =========================================================

@ticket_transfer_bp.route(
    "/",
    methods=["GET"]
)
def get_all():

    return get_transfers()


# =========================================================
# GET DETAIL
# =========================================================

@ticket_transfer_bp.route(
    "/<int:id>",
    methods=["GET"]
)
def get_detail(id):

    return get_transfer(id)


# =========================================================
# ACCEPT
# =========================================================

@ticket_transfer_bp.route(
    "/<int:id>/accept",
    methods=["POST"]
)
def accept(id):

    return accept_transfer(id)


# =========================================================
# CANCEL
# =========================================================

@ticket_transfer_bp.route(
    "/<int:id>/cancel",
    methods=["POST"]
)
def cancel(id):

    return cancel_transfer(id)