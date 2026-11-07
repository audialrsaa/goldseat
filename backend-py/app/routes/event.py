
from flask import Blueprint

from app.controllers.event_controller import (
    get_events,
    get_event,
    create_event,
    update_event,
    delete_event,
    publish_event,
)

from app.middleware.auth_middleware import jwt_auth_required
from app.middleware.role_middleware import role_required


event_bp = Blueprint("event", __name__)


# =========================================================
# GET ALL EVENTS
# =========================================================

@event_bp.route("/", methods=["GET"])
def index():
    return get_events()


# =========================================================
# GET DETAIL EVENT
# =========================================================

@event_bp.route("/<int:id>", methods=["GET"])
def show(id):
    return get_event(id)


# =========================================================
# CREATE EVENT
# =========================================================

@event_bp.route("/", methods=["POST"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def store():
    return create_event()


# =========================================================
# UPDATE EVENT
# =========================================================

@event_bp.route("/<int:id>", methods=["PUT", "PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def update(id):
    return update_event(id)


# =========================================================
# CHANGE EVENT PUBLISH STATUS
# =========================================================

@event_bp.route("/<int:id>/publish", methods=["PATCH"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def change_publish_status(id):
    return publish_event(id)


# =========================================================
# DELETE EVENT
# =========================================================

@event_bp.route("/<int:id>", methods=["DELETE"])
@jwt_auth_required
@role_required("super_admin", "event_manager")
def destroy(id):
    return delete_event(id)
