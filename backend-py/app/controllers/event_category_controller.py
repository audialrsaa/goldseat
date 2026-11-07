from flask import request, jsonify
from slugify import slugify

from app.extensions import db
from app.models.event_category import EventCategory


# ============================================================
# GET ALL CATEGORIES
# ============================================================

def get_event_categories():

    categories = (
        EventCategory.query
        .order_by(EventCategory.id.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "data": [
            category.to_dict()
            for category in categories
        ]
    }), 200


# ============================================================
# GET DETAIL CATEGORY
# ============================================================

def get_event_category(id):

    category = db.session.get(
        EventCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori event tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": category.to_dict()
    }), 200


# ============================================================
# CREATE CATEGORY
# ============================================================

def create_event_category():

    data = request.get_json() or {}

    name = data.get("name")
    icon = data.get("icon")
    is_active = data.get(
        "is_active",
        True
    )

    # ========================================================
    # VALIDASI FIELD WAJIB
    # ========================================================

    if not name or not name.strip():
        return jsonify({
            "status": "error",
            "message": "Nama kategori wajib diisi"
        }), 400

    name = name.strip()

    # ========================================================
    # CEK NAMA DUPLIKAT
    # ========================================================

    existing_name = EventCategory.query.filter(
        db.func.lower(EventCategory.name)
        == name.lower()
    ).first()

    if existing_name:
        return jsonify({
            "status": "error",
            "message": "Nama kategori sudah digunakan"
        }), 409

    # ========================================================
    # GENERATE SLUG
    # ========================================================

    slug = slugify(name)

    existing_slug = EventCategory.query.filter_by(
        slug=slug
    ).first()

    if existing_slug:
        return jsonify({
            "status": "error",
            "message": "Kategori dengan nama tersebut sudah ada"
        }), 409

    # ========================================================
    # CREATE
    # ========================================================

    category = EventCategory(
        name=name,
        slug=slug,
        icon=icon,
        is_active=bool(is_active)
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Kategori event berhasil ditambahkan",
        "data": category.to_dict()
    }), 201


# ============================================================
# UPDATE CATEGORY
# ============================================================

def update_event_category(id):

    category = db.session.get(
        EventCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori event tidak ditemukan"
        }), 404

    data = request.get_json() or {}

    # ========================================================
    # NAME + SLUG
    # ========================================================

    name = data.get("name")

    if name is not None:

        if not name.strip():
            return jsonify({
                "status": "error",
                "message": "Nama kategori tidak boleh kosong"
            }), 400

        name = name.strip()

        # Cek nama duplikat

        existing_name = EventCategory.query.filter(
            db.func.lower(EventCategory.name)
            == name.lower(),
            EventCategory.id != id
        ).first()

        if existing_name:
            return jsonify({
                "status": "error",
                "message": "Nama kategori sudah digunakan"
            }), 409

        # Generate slug baru

        new_slug = slugify(name)

        existing_slug = EventCategory.query.filter(
            EventCategory.slug == new_slug,
            EventCategory.id != id
        ).first()

        if existing_slug:
            return jsonify({
                "status": "error",
                "message": "Kategori dengan nama tersebut sudah ada"
            }), 409

        category.name = name
        category.slug = new_slug

    # ========================================================
    # ICON
    # ========================================================

    if "icon" in data:
        category.icon = data.get("icon")

    # ========================================================
    # IS ACTIVE
    # ========================================================

    if "is_active" in data:
        category.is_active = bool(
            data.get("is_active")
        )

    # ========================================================
    # SAVE
    # ========================================================

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Kategori event berhasil diupdate",
        "data": category.to_dict()
    }), 200


# ============================================================
# TOGGLE STATUS
# ============================================================

def toggle_event_category_status(id):

    category = db.session.get(
        EventCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori event tidak ditemukan"
        }), 404

    data = request.get_json() or {}

    if "is_active" in data:

        category.is_active = bool(
            data.get("is_active")
        )

    else:

        category.is_active = (
            not category.is_active
        )

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Status kategori event berhasil diubah",
        "data": category.to_dict()
    }), 200


# ============================================================
# DELETE CATEGORY
# ============================================================

def delete_event_category(id):

    category = db.session.get(
        EventCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori event tidak ditemukan"
        }), 404

    # ========================================================
    # CEK APAKAH MASIH DIPAKAI EVENT
    # ========================================================

    from app.models.event import Event

    used_by_event = Event.query.filter_by(
        category_id=id
    ).first()

    if used_by_event:
        return jsonify({
            "status": "error",
            "message": (
                "Kategori masih digunakan oleh event, "
                "tidak bisa dihapus"
            )
        }), 409

    # ========================================================
    # DELETE
    # ========================================================

    db.session.delete(category)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Kategori event berhasil dihapus"
    }), 200