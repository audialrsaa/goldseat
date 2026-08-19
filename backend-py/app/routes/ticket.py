from flask import Blueprint

from app.controllers.ticket_controller import (
    create_ticket,
    get_tickets,
    get_ticket,
    update_ticket,
    delete_ticket,
    check_in_ticket
)


ticket_bp = Blueprint(
    "ticket",
    __name__
)


# =========================================================
# CREATE
# =========================================================

@ticket_bp.route(
    "/",
    methods=["POST"]
)
def create():

    return create_ticket()


# =========================================================
# GET ALL
# =========================================================

@ticket_bp.route(
    "/",
    methods=["GET"]
)
def get_all():

    return get_tickets()


# =========================================================
# GET DETAIL
# =========================================================

@ticket_bp.route(
    "/<int:id>",
    methods=["GET"]
)
def get_detail(id):

    return get_ticket(id)


# =========================================================
# UPDATE
# =========================================================

@ticket_bp.route(
    "/<int:id>",
    methods=["PUT"]
)
def update(id):

    return update_ticket(id)


# =========================================================
# DELETE
# =========================================================

@ticket_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)
def delete(id):

    return delete_ticket(id)

# =========================================================
# CHECK-IN
# =========================================================

@ticket_bp.route(
    "/check-in",
    methods=["POST"]
)
def check_in():

    return check_in_ticket()