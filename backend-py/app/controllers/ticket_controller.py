from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app.extensions import db
from app.models.ticket import Ticket
from app.models.order_item import OrderItem
from app.models.seat import Seat
from app.models.checkin import Checkin

from app.utils.auth import get_current_user_id


# =========================================================
# HELPER
# =========================================================

def is_admin_or_staff():
    """
    Mengecek role dari JWT.

    Role yang boleh mengelola ticket:
    - super_admin
    - event_manager
    - cashier
    - checkin_staff
    """

    claims = get_jwt()

    role = claims.get("role")

    return role in [
        "super_admin",
        "event_manager",
        "cashier",
        "checkin_staff"
    ]


def can_manage_ticket(ticket):
    """
    User boleh mengelola ticket jika:
    - dia owner ticket
    - atau dia admin/staff
    """

    user_id = get_current_user_id()

    if ticket.owner_user_id == user_id:
        return True

    if is_admin_or_staff():
        return True

    return False


# =========================================================
# CREATE
# =========================================================

@jwt_required()
def create_ticket():

    data = request.get_json() or {}

    order_item_id = data.get("order_item_id")
    seat_id = data.get("seat_id")
    ticket_number = data.get("ticket_number")
    qr_code = data.get("qr_code")

    # owner_user_id TIDAK diambil dari frontend
    # owner_name juga akan diambil dari user pemilik order

    # ==========================
    # USER DARI JWT
    # ==========================

    user_id = get_current_user_id()

    # ==========================
    # VALIDASI
    # ==========================

    if not order_item_id:
        return jsonify({
            "status": "error",
            "message": "Order item wajib diisi"
        }), 400

    if not ticket_number:
        return jsonify({
            "status": "error",
            "message": "Ticket number wajib diisi"
        }), 400

    if not qr_code:
        return jsonify({
            "status": "error",
            "message": "QR code wajib diisi"
        }), 400

    # ==========================
    # CEK ORDER ITEM
    # ==========================

    order_item = db.session.get(
        OrderItem,
        order_item_id
    )

    if not order_item:
        return jsonify({
            "status": "error",
            "message": "Order item tidak ditemukan"
        }), 404

    # ==========================
    # CEK PEMILIK ORDER
    # ==========================

    if not order_item.order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    order = order_item.order

    # ==========================
    # OWNER ORDER
    # ==========================

    if order.user_id != user_id and not is_admin_or_staff():

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki order item ini"
        }), 403

    # ==========================
    # TENTUKAN OWNER TICKET
    # ==========================

    owner_user_id = order.user_id

    owner_name = None

    if order.user:

        owner_name = order.user.full_name

    # ==========================
    # CEK SEAT
    # ==========================

    if seat_id:

        seat = db.session.get(
            Seat,
            seat_id
        )

        if not seat:

            return jsonify({
                "status": "error",
                "message": "Seat tidak ditemukan"
            }), 404

    # ==========================
    # CEK TICKET NUMBER
    # ==========================

    existing_ticket = Ticket.query.filter_by(
        ticket_number=ticket_number
    ).first()

    if existing_ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket number sudah digunakan"
        }), 409

    # ==========================
    # CEK QR CODE
    # ==========================

    existing_qr = Ticket.query.filter_by(
        qr_code=qr_code
    ).first()

    if existing_qr:

        return jsonify({
            "status": "error",
            "message": "QR code sudah digunakan"
        }), 409

    # ==========================
    # CREATE
    # ==========================

    ticket = Ticket(
        order_item_id=order_item_id,
        seat_id=seat_id,
        ticket_number=ticket_number,
        qr_code=qr_code,
        owner_user_id=owner_user_id,
        owner_name=owner_name,
        status="issued"
    )

    db.session.add(ticket)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket berhasil dibuat",
        "data": ticket.to_dict()
    }), 201


# =========================================================
# GET ALL / MY TICKETS
# =========================================================

@jwt_required()
def get_tickets():

    user_id = get_current_user_id()

    # ==========================
    # ADMIN / STAFF
    # ==========================

    if is_admin_or_staff():

        tickets = Ticket.query.order_by(
            Ticket.id.desc()
        ).all()

    # ==========================
    # USER BIASA
    # ==========================

    else:

        tickets = Ticket.query.filter_by(
            owner_user_id=user_id
        ).order_by(
            Ticket.id.desc()
        ).all()

    return jsonify({
        "status": "success",
        "data": [
            ticket.to_dict()
            for ticket in tickets
        ]
    }), 200


# =========================================================
# GET DETAIL
# =========================================================

@jwt_required()
def get_ticket(id):

    ticket = db.session.get(
        Ticket,
        id
    )

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # CEK AKSES
    # ==========================

    if not can_manage_ticket(ticket):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke ticket ini"
        }), 403

    return jsonify({
        "status": "success",
        "data": ticket.to_dict()
    }), 200


# =========================================================
# UPDATE
# =========================================================

@jwt_required()
def update_ticket(id):

    ticket = db.session.get(
        Ticket,
        id
    )

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # CEK AKSES
    # ==========================

    if not can_manage_ticket(ticket):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke ticket ini"
        }), 403

    data = request.get_json() or {}

    # ==========================
    # ORDER ITEM
    # ==========================

    if "order_item_id" in data:

        order_item_id = data.get(
            "order_item_id"
        )

        if not order_item_id:

            return jsonify({
                "status": "error",
                "message": "Order item tidak boleh kosong"
            }), 400

        order_item = db.session.get(
            OrderItem,
            order_item_id
        )

        if not order_item:

            return jsonify({
                "status": "error",
                "message": "Order item tidak ditemukan"
            }), 404

        ticket.order_item_id = order_item_id

        # Update owner berdasarkan order item baru
        if order_item.order:

            ticket.owner_user_id = (
                order_item.order.user_id
            )

            if order_item.order.user:

                ticket.owner_name = (
                    order_item.order.user.full_name
                )

    # ==========================
    # SEAT
    # ==========================

    if "seat_id" in data:

        seat_id = data.get(
            "seat_id"
        )

        if seat_id:

            seat = db.session.get(
                Seat,
                seat_id
            )

            if not seat:

                return jsonify({
                    "status": "error",
                    "message": "Seat tidak ditemukan"
                }), 404

        ticket.seat_id = seat_id

    # ==========================
    # TICKET NUMBER
    # ==========================

    if "ticket_number" in data:

        ticket_number = data.get(
            "ticket_number"
        )

        if not ticket_number:

            return jsonify({
                "status": "error",
                "message": "Ticket number tidak boleh kosong"
            }), 400

        existing_ticket = Ticket.query.filter(
            Ticket.ticket_number == ticket_number,
            Ticket.id != ticket.id
        ).first()

        if existing_ticket:

            return jsonify({
                "status": "error",
                "message": "Ticket number sudah digunakan"
            }), 409

        ticket.ticket_number = ticket_number

    # ==========================
    # QR CODE
    # ==========================

    if "qr_code" in data:

        qr_code = data.get(
            "qr_code"
        )

        if not qr_code:

            return jsonify({
                "status": "error",
                "message": "QR code tidak boleh kosong"
            }), 400

        existing_qr = Ticket.query.filter(
            Ticket.qr_code == qr_code,
            Ticket.id != ticket.id
        ).first()

        if existing_qr:

            return jsonify({
                "status": "error",
                "message": "QR code sudah digunakan"
            }), 409

        ticket.qr_code = qr_code

    # ==========================
    # OWNER NAME
    # ==========================

    # Hanya admin/staff yang boleh mengubah
    # owner_name secara manual.

    if "owner_name" in data:

        if not is_admin_or_staff():

            return jsonify({
                "status": "error",
                "message": "Owner name hanya dapat diubah oleh admin/staff"
            }), 403

        ticket.owner_name = data.get(
            "owner_name"
        )

    # ==========================
    # STATUS
    # ==========================

    if "status" in data:

        if not is_admin_or_staff():

            return jsonify({
                "status": "error",
                "message": "Status ticket hanya dapat diubah oleh admin/staff"
            }), 403

        status = data.get(
            "status"
        )

        allowed_status = [
            "issued",
            "used",
            "cancelled",
            "transferred"
        ]

        if status not in allowed_status:

            return jsonify({
                "status": "error",
                "message": "Status ticket tidak valid"
            }), 400

        ticket.status = status

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket berhasil diupdate",
        "data": ticket.to_dict()
    }), 200


# =========================================================
# DELETE
# =========================================================

@jwt_required()
def delete_ticket(id):

    ticket = db.session.get(
        Ticket,
        id
    )

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # DELETE HANYA ADMIN/STAFF
    # ==========================

    if not is_admin_or_staff():

        return jsonify({
            "status": "error",
            "message": "Hanya admin/staff yang dapat menghapus ticket"
        }), 403

    db.session.delete(ticket)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Ticket berhasil dihapus"
    }), 200


# =========================================================
# CHECK-IN TICKET
# =========================================================

@jwt_required()
def check_in_ticket():

    # ==========================
    # CEK ROLE
    # ==========================

    if not is_admin_or_staff():

        return jsonify({
            "status": "error",
            "message": "Hanya staff/admin yang dapat melakukan check-in"
        }), 403

    data = request.get_json() or {}

    qr_code = data.get(
        "qr_code"
    )

    if not qr_code:

        return jsonify({
            "status": "error",
            "message": "QR code wajib diisi"
        }), 400

    # ==========================
    # CARI TICKET
    # ==========================

    ticket = Ticket.query.filter_by(
        qr_code=qr_code
    ).first()

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # CEK STATUS
    # ==========================

    if ticket.status == "used":

        return jsonify({
            "status": "error",
            "message": "Ticket sudah digunakan"
        }), 400

    if ticket.status == "cancelled":

        return jsonify({
            "status": "error",
            "message": "Ticket sudah dibatalkan"
        }), 400

    # ==========================
    # CHECK-IN
    # ==========================

    user_id = get_current_user_id()

    gate = data.get("gate")
    device_id = data.get("device_id")

    ticket.status = "used"

    checkin = Checkin(
        ticket_id=ticket.id,
        checked_in_by=user_id,
        gate=gate,
        device_id=device_id,
        checked_in_at=datetime.utcnow()
    )

    db.session.add(checkin)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Check-in berhasil",
        "data": {
            "ticket": ticket.to_dict(),
            "checkin": checkin.to_dict()
        }
    }), 200