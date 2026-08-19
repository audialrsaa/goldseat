from flask import Blueprint

from app.controllers.ticket_category_controller import (
    get_ticket_categories,
    get_ticket_categories_by_event,
    get_ticket_category,
    create_ticket_category,
    update_ticket_category,
    delete_ticket_category
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


ticket_category_bp = Blueprint(
    "ticket_category",
    __name__
)


@ticket_category_bp.route(
    "/",
    methods=["GET"]
)
def index():

    return get_ticket_categories()


@ticket_category_bp.route(
    "/event/<int:event_id>",
    methods=["GET"]
)
def get_by_event(event_id):

    return get_ticket_categories_by_event(event_id)


@ticket_category_bp.route(
    "/<int:id>",
    methods=["GET"]
)
def show(id):

    return get_ticket_category(id)


@ticket_category_bp.route(
    "/",
    methods=["POST"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def store():

    return create_ticket_category()


@ticket_category_bp.route(
    "/<int:id>",
    methods=["PUT", "PATCH"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def update(id):

    return update_ticket_category(id)


@ticket_category_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)
@jwt_auth_required
@role_required(
    "super_admin",
    "event_manager"
)
def destroy(id):

    return delete_ticket_category(id)
