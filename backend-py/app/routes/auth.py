from flask import Blueprint

from app.controllers.auth_controller import (
    register,
    login,
    me
)


auth_bp = Blueprint(
    "auth",
    __name__
)


# =========================================================
# REGISTER
# =========================================================

auth_bp.route(
    "/register",
    methods=["POST"]
)(register)


# =========================================================
# LOGIN
# =========================================================

auth_bp.route(
    "/login",
    methods=["POST"]
)(login)


# =========================================================
# ME
# =========================================================

auth_bp.route(
    "/me",
    methods=["GET"]
)(me)