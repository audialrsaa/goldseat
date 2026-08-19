from datetime import datetime, timedelta

from flask import request, jsonify

from app.extensions import db
from app.models.seat import Seat
from app.models.ticket_category import TicketCategory


# =========================================================
# GET ALL
# =========================================================

def get_seats():

    ticket_category_id = request.args.get(
        "ticket_category_id"
    )

    query = Seat.query

    if ticket_category_id:
        query = query.filter_by(
            ticket_category_id=ticket_category_id
        )

    seats = query.order_by(
        Seat.id.asc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            seat.to_dict()
            for seat in seats
        ]
    }), 200


# =========================================================
# GET DETAIL
# =========================================================

def get_seat(id):

    seat = db.session.get(
        Seat,
        id
    )

    if not seat:
        return jsonify({
            "status": "error",
            "message": "Seat tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": seat.to_dict()
    }), 200


# =========================================================
# CREATE
# =========================================================

def create_seat():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body wajib diisi"
        }), 400

    ticket_category_id = data.get(
        "ticket_category_id"
    )

    seat_code = data.get(
        "seat_code"
    )

    if not ticket_category_id:
        return jsonify({
            "status": "error",
            "message": "Ticket category ID wajib diisi"
        }), 400

    if not seat_code:
        return jsonify({
            "status": "error",
            "message": "Seat code wajib diisi"
        }), 400

    # Cek ticket category

    category = db.session.get(
        TicketCategory,
        ticket_category_id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Ticket category tidak ditemukan"
        }), 404

    # Cek seat code sudah digunakan
    existing_seat = Seat.query.filter_by(
        ticket_category_id=ticket_category_id,
        seat_code=seat_code
    ).first()

    if existing_seat:
        return jsonify({
            "status": "error",
            "message": "Seat code sudah digunakan"
        }), 409

    seat = Seat(
        ticket_category_id=ticket_category_id,
        seat_code=seat_code,
        status="available"
    )

    db.session.add(seat)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Seat berhasil ditambahkan",
        "data": seat.to_dict()
    }), 201


# =========================================================
# UPDATE
# =========================================================

def update_seat(id):

    seat = db.session.get(
        Seat,
        id
    )

    if not seat:
        return jsonify({
            "status": "error",
            "message": "Seat tidak ditemukan"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body wajib diisi"
        }), 400

    # Jangan sembarangan mengubah seat
    # yang sedang locked / booked

    if seat.status in ["locked", "booked"]:

        return jsonify({
            "status": "error",
            "message": (
                "Seat yang sedang locked atau booked "
                "tidak dapat diedit"
            )
        }), 400

    if "ticket_category_id" in data:

        category = db.session.get(
            TicketCategory,
            data["ticket_category_id"]
        )

        if not category:
            return jsonify({
                "status": "error",
                "message": "Ticket category tidak ditemukan"
            }), 404

        seat.ticket_category_id = (
            data["ticket_category_id"]
        )

    if "seat_code" in data:

        existing_seat = Seat.query.filter(
            Seat.ticket_category_id
            == seat.ticket_category_id,
            Seat.seat_code
            == data["seat_code"],
            Seat.id != seat.id
        ).first()

        if existing_seat:
            return jsonify({
                "status": "error",
                "message": "Seat code sudah digunakan"
            }), 409

        seat.seat_code = data["seat_code"]

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Seat berhasil diupdate",
        "data": seat.to_dict()
    }), 200


# =========================================================
# DELETE
# =========================================================

def delete_seat(id):

    seat = db.session.get(
        Seat,
        id
    )

    if not seat:
        return jsonify({
            "status": "error",
            "message": "Seat tidak ditemukan"
        }), 404

    if seat.status == "booked":

        return jsonify({
            "status": "error",
            "message": (
                "Seat yang sudah booked "
                "tidak dapat dihapus"
            )
        }), 400

    db.session.delete(seat)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Seat berhasil dihapus"
    }), 200


# =========================================================
# LOCK SEAT
# =========================================================

def lock_seat(id):

    seat = db.session.get(
        Seat,
        id
    )

    if not seat:
        return jsonify({
            "status": "error",
            "message": "Seat tidak ditemukan"
        }), 404

    # Ambil user dari JWT
    from flask_jwt_extended import get_jwt_identity

    user_id = get_jwt_identity()

    now = datetime.utcnow()

    # =====================================================
    # CEK LOCK EXPIRED
    # =====================================================

    if (
        seat.status == "locked"
        and seat.locked_at
        and now >= seat.locked_at + timedelta(minutes=10)
    ):

        seat.status = "available"
        seat.locked_by = None
        seat.locked_at = None

        db.session.commit()

    # =====================================================
    # SEAT BOOKED
    # =====================================================

    if seat.status == "booked":

        return jsonify({
            "status": "error",
            "message": "Seat sudah dibooking"
        }), 409

    # =====================================================
    # SEAT LOCKED USER LAIN
    # =====================================================

    if (
        seat.status == "locked"
        and str(seat.locked_by) != str(user_id)
    ):

        return jsonify({
            "status": "error",
            "message": "Seat sedang dipilih user lain"
        }), 409

    # =====================================================
    # LOCK
    # =====================================================

    seat.status = "locked"
    seat.locked_by = user_id
    seat.locked_at = now

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Seat berhasil dikunci selama 10 menit",
        "data": seat.to_dict()
    }), 200


# =========================================================
# UNLOCK SEAT
# =========================================================

def unlock_seat(id):

    seat = db.session.get(
        Seat,
        id
    )

    if not seat:
        return jsonify({
            "status": "error",
            "message": "Seat tidak ditemukan"
        }), 404

    from flask_jwt_extended import get_jwt_identity

    user_id = get_jwt_identity()

    if seat.status != "locked":

        return jsonify({
            "status": "error",
            "message": "Seat tidak sedang dikunci"
        }), 400

    if str(seat.locked_by) != str(user_id):

        return jsonify({
            "status": "error",
            "message": "Kamu tidak memiliki lock seat ini"
        }), 403

    seat.status = "available"
    seat.locked_by = None
    seat.locked_at = None

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Seat berhasil dilepas",
        "data": seat.to_dict()
    }), 200