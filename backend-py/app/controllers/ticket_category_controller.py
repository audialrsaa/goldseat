from flask import request, jsonify

from app.extensions import db
from app.models.ticket_category import TicketCategory
from app.models.event import Event


# =========================================================
# GET ALL
# =========================================================

def get_ticket_categories():

    event_id = request.args.get("event_id")

    query = TicketCategory.query

    if event_id:
        query = query.filter_by(
            event_id=event_id
        )

    categories = query.order_by(
        TicketCategory.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            category.to_dict()
            for category in categories
        ]
    }), 200


# =========================================================
# GET BY EVENT
# =========================================================

def get_ticket_categories_by_event(event_id):

    categories = TicketCategory.query.filter_by(
        event_id=event_id
    ).order_by(
        TicketCategory.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            category.to_dict()
            for category in categories
        ]
    }), 200


# =========================================================
# GET DETAIL
# =========================================================

def get_ticket_category(id):

    category = db.session.get(
        TicketCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Ticket category tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": category.to_dict()
    }), 200


# =========================================================
# CREATE
# =========================================================

def create_ticket_category():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body wajib diisi"
        }), 400

    event_id = data.get("event_id")
    name = data.get("name")
    price = data.get("price")
    stock = data.get("stock")

    active = data.get(
        "active",
        True
    )

    sale_start_at = data.get(
        "sale_start_at"
    )

    sale_end_at = data.get(
        "sale_end_at"
    )

    # =====================================================
    # VALIDASI
    # =====================================================

    if not event_id:
        return jsonify({
            "status": "error",
            "message": "Event ID wajib diisi"
        }), 400

    if not name:
        return jsonify({
            "status": "error",
            "message": "Name wajib diisi"
        }), 400

    if price is None:
        return jsonify({
            "status": "error",
            "message": "Price wajib diisi"
        }), 400

    if stock is None:
        return jsonify({
            "status": "error",
            "message": "Stock wajib diisi"
        }), 400

    # =====================================================
    # VALIDASI ANGKA
    # =====================================================

    try:
        price = float(price)
        stock = int(stock)
    except (ValueError, TypeError):

        return jsonify({
            "status": "error",
            "message": "Price atau stock tidak valid"
        }), 400

    if price < 0:
        return jsonify({
            "status": "error",
            "message": "Price tidak boleh negatif"
        }), 400

    if stock < 0:
        return jsonify({
            "status": "error",
            "message": "Stock tidak boleh negatif"
        }), 400

    # =====================================================
    # CEK EVENT
    # =====================================================

    event = db.session.get(
        Event,
        event_id
    )

    if not event:
        return jsonify({
            "status": "error",
            "message": "Event tidak ditemukan"
        }), 404

    # =====================================================
    # CREATE
    # =====================================================

    category = TicketCategory(
        event_id=event_id,
        name=name,
        price=price,
        stock=stock,
        sold=0,
        active=active,
        sale_start_at=sale_start_at,
        sale_end_at=sale_end_at
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket category berhasil ditambahkan",
        "data": category.to_dict()
    }), 201


# =========================================================
# UPDATE
# =========================================================

def update_ticket_category(id):

    category = db.session.get(
        TicketCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Ticket category tidak ditemukan"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body wajib diisi"
        }), 400

    # =====================================================
    # EVENT
    # =====================================================

    if "event_id" in data:

        event = db.session.get(
            Event,
            data["event_id"]
        )

        if not event:
            return jsonify({
                "status": "error",
                "message": "Event tidak ditemukan"
            }), 404

        category.event_id = data["event_id"]

    # =====================================================
    # NAME
    # =====================================================

    if "name" in data:

        if not data["name"]:
            return jsonify({
                "status": "error",
                "message": "Name tidak boleh kosong"
            }), 400

        category.name = data["name"]

    # =====================================================
    # PRICE
    # =====================================================

    if "price" in data:

        try:
            price = float(data["price"])
        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Price tidak valid"
            }), 400

        if price < 0:
            return jsonify({
                "status": "error",
                "message": "Price tidak boleh negatif"
            }), 400

        category.price = price

    # =====================================================
    # STOCK
    # =====================================================

    if "stock" in data:

        try:
            stock = int(data["stock"])
        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Stock tidak valid"
            }), 400

        if stock < category.sold:

            return jsonify({
                "status": "error",
                "message": (
                    "Stock tidak boleh lebih kecil "
                    "dari jumlah tiket yang sudah terjual"
                )
            }), 400

        category.stock = stock

    # =====================================================
    # ACTIVE
    # =====================================================

    if "active" in data:
        category.active = data["active"]

    # =====================================================
    # SALE START
    # =====================================================

    if "sale_start_at" in data:
        category.sale_start_at = data["sale_start_at"]

    # =====================================================
    # SALE END
    # =====================================================

    if "sale_end_at" in data:
        category.sale_end_at = data["sale_end_at"]

    # =====================================================
    # SAVE
    # =====================================================

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket category berhasil diupdate",
        "data": category.to_dict()
    }), 200


# =========================================================
# DELETE
# =========================================================

def delete_ticket_category(id):

    category = db.session.get(
        TicketCategory,
        id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Ticket category tidak ditemukan"
        }), 404

    db.session.delete(category)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket category berhasil dihapus"
    }), 200