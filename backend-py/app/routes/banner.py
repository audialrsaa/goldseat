from flask import Blueprint

from app.controllers.banner_controller import (
    get_banners,
    get_banner,
    create_banner,
    update_banner,
    delete_banner
)


banner_bp = Blueprint(
    "banner",
    __name__
)


# =========================================================
# GET ALL
# =========================================================

banner_bp.route(
    "/",
    methods=["GET"]
)(get_banners)


# =========================================================
# GET DETAIL
# =========================================================

banner_bp.route(
    "/<int:id>",
    methods=["GET"]
)(get_banner)


# =========================================================
# CREATE
# =========================================================

banner_bp.route(
    "/",
    methods=["POST"]
)(create_banner)


# =========================================================
# UPDATE
# =========================================================

banner_bp.route(
    "/<int:id>",
    methods=["PUT"]
)(update_banner)


# =========================================================
# DELETE
# =========================================================

banner_bp.route(
    "/<int:id>",
    methods=["DELETE"]
)(delete_banner)