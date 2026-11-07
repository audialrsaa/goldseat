from flask import request, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.banner import Banner
from app.utils.auth import get_current_role


# =========================================================
# HELPER — CHECK SUPER ADMIN
# =========================================================

def _check_super_admin():
    role = get_current_role()

    if role != "super_admin":
        return jsonify({
            "status": "error",
            "message": "Akses hanya untuk super admin"
        }), 403

    return None


# =========================================================
# GET ALL BANNERS
# GET /api/banners/
# =========================================================

@jwt_required()
def get_banners():
    error = _check_super_admin()

    if error:
        return error

    banners = (
        Banner.query
        .order_by(
            Banner.sort_order.asc(),
            Banner.created_at.desc()
        )
        .all()
    )

    return jsonify({
        "status": "success",
        "data": [banner.to_dict() for banner in banners]
    }), 200


# =========================================================
# GET BANNER BY ID
# GET /api/banners/<id>
# =========================================================

@jwt_required()
def get_banner(id):
    error = _check_super_admin()

    if error:
        return error

    banner = db.session.get(Banner, id)

    if not banner:
        return jsonify({
            "status": "error",
            "message": "Banner tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": banner.to_dict()
    }), 200


# =========================================================
# CREATE BANNER
# POST /api/banners/
# =========================================================

@jwt_required()
def create_banner():
    error = _check_super_admin()

    if error:
        return error

    data = request.get_json() or {}

    image = data.get("image")
    title = data.get("title")
    link_url = data.get("link_url")
    sort_order = data.get("sort_order", 0)
    is_active = data.get("is_active", True)
    start_at = data.get("start_at")
    end_at = data.get("end_at")

    # -----------------------------------------------------
    # VALIDASI
    # -----------------------------------------------------

    if not image:
        return jsonify({
            "status": "error",
            "message": "Image wajib diisi"
        }), 400

    # -----------------------------------------------------
    # PARSE DATETIME
    # -----------------------------------------------------

    from datetime import datetime

    parsed_start_at = None
    parsed_end_at = None

    if start_at:
        try:
            parsed_start_at = datetime.fromisoformat(
                start_at.replace("Z", "+00:00")
            )
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Format start_at tidak valid"
            }), 400

    if end_at:
        try:
            parsed_end_at = datetime.fromisoformat(
                end_at.replace("Z", "+00:00")
            )
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Format end_at tidak valid"
            }), 400

    if parsed_start_at and parsed_end_at:
        if parsed_end_at <= parsed_start_at:
            return jsonify({
                "status": "error",
                "message": "end_at harus lebih besar dari start_at"
            }), 400

    # -----------------------------------------------------
    # CREATE
    # -----------------------------------------------------

    banner = Banner(
        image=image,
        title=title,
        link_url=link_url,
        sort_order=sort_order,
        is_active=is_active,
        start_at=parsed_start_at,
        end_at=parsed_end_at
    )

    db.session.add(banner)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Banner berhasil dibuat",
        "data": banner.to_dict()
    }), 201


# =========================================================
# UPDATE BANNER
# PUT /api/banners/<id>
# =========================================================

@jwt_required()
def update_banner(id):
    error = _check_super_admin()

    if error:
        return error

    banner = db.session.get(Banner, id)

    if not banner:
        return jsonify({
            "status": "error",
            "message": "Banner tidak ditemukan"
        }), 404

    data = request.get_json() or {}

    from datetime import datetime

    # -----------------------------------------------------
    # UPDATE FIELD
    # -----------------------------------------------------

    if "image" in data:
        if not data["image"]:
            return jsonify({
                "status": "error",
                "message": "Image tidak boleh kosong"
            }), 400

        banner.image = data["image"]

    if "title" in data:
        banner.title = data["title"]

    if "link_url" in data:
        banner.link_url = data["link_url"]

    if "sort_order" in data:
        banner.sort_order = data["sort_order"]

    if "is_active" in data:
        banner.is_active = data["is_active"]

    # -----------------------------------------------------
    # START AT
    # -----------------------------------------------------

    if "start_at" in data:
        if data["start_at"]:
            try:
                banner.start_at = datetime.fromisoformat(
                    data["start_at"].replace("Z", "+00:00")
                )
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Format start_at tidak valid"
                }), 400
        else:
            banner.start_at = None

    # -----------------------------------------------------
    # END AT
    # -----------------------------------------------------

    if "end_at" in data:
        if data["end_at"]:
            try:
                banner.end_at = datetime.fromisoformat(
                    data["end_at"].replace("Z", "+00:00")
                )
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Format end_at tidak valid"
                }), 400
        else:
            banner.end_at = None

    # -----------------------------------------------------
    # VALIDASI RANGE
    # -----------------------------------------------------

    if banner.start_at and banner.end_at:
        if banner.end_at <= banner.start_at:
            return jsonify({
                "status": "error",
                "message": "end_at harus lebih besar dari start_at"
            }), 400

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Banner berhasil diperbarui",
        "data": banner.to_dict()
    }), 200


# =========================================================
# DELETE BANNER
# DELETE /api/banners/<id>
# =========================================================

@jwt_required()
def delete_banner(id):
    error = _check_super_admin()

    if error:
        return error

    banner = db.session.get(Banner, id)

    if not banner:
        return jsonify({
            "status": "error",
            "message": "Banner tidak ditemukan"
        }), 404

    db.session.delete(banner)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Banner berhasil dihapus"
    }), 200