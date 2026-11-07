from flask import Blueprint

from app.controllers.user_controller import (
    get_users,
    get_user,
    create_user,
    update_user,
    delete_user,
    get_roles,
)

user_bp = Blueprint("user", __name__)


# =========================================================
# GET ALL USERS
# =========================================================

@user_bp.route("/", methods=["GET"])
def index():
    return get_users()


# =========================================================
# GET DETAIL USER
# =========================================================

@user_bp.route("/<int:user_id>", methods=["GET"])
def show(user_id):
    return get_user(user_id)


# =========================================================
# CREATE USER
# =========================================================

@user_bp.route("/", methods=["POST"])
def store():
    return create_user()


# =========================================================
# UPDATE USER
# =========================================================

@user_bp.route("/<int:user_id>", methods=["PUT", "PATCH"])
def update(user_id):
    return update_user(user_id)


# =========================================================
# DELETE USER
# =========================================================

@user_bp.route("/<int:user_id>", methods=["DELETE"])
def destroy(user_id):
    return delete_user(user_id)


# =========================================================
# GET ALL ROLES
# =========================================================

@user_bp.route("/roles", methods=["GET"])
def roles():
    return get_roles()
