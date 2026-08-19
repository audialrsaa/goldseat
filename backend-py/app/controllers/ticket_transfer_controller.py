from datetime import datetime, timedelta

from flask import request, jsonify

from flask_jwt_extended import jwt_required

from app.extensions import db

from app.models.ticket import Ticket
from app.models.ticket_transfer import TicketTransfer
from app.models.user import User

from app.utils.auth import get_current_user_id


# =========================================================
# CREATE TRANSFER
# =========================================================

@jwt_required()
def create_transfer():

    data = request.get_json() or {}

    ticket_id = data.get("ticket_id")
    to_email = data.get("to_email")

    # ==========================
    # USER DARI JWT
    # ==========================

    from_user_id = get_current_user_id()

    # ==========================
    # VALIDASI
    # ==========================

    if not ticket_id:

        return jsonify({
            "status": "error",
            "message": "Ticket ID wajib diisi"
        }), 400

    if not to_email:

        return jsonify({
            "status": "error",
            "message": "Email penerima wajib diisi"
        }), 400

    # ==========================
    # CARI TICKET
    # ==========================

    ticket = db.session.get(
        Ticket,
        ticket_id
    )

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # CEK PEMILIK
    # ==========================

    if ticket.owner_user_id != from_user_id:

        return jsonify({
            "status": "error",
            "message": "Anda bukan pemilik ticket ini"
        }), 403

    # ==========================
    # CEK STATUS TICKET
    # ==========================

    if ticket.status == "used":

        return jsonify({
            "status": "error",
            "message": "Ticket yang sudah digunakan tidak dapat ditransfer"
        }), 400

    if ticket.status == "cancelled":

        return jsonify({
            "status": "error",
            "message": "Ticket yang sudah dibatalkan tidak dapat ditransfer"
        }), 400

    # ==========================
    # CEK TRANSFER PENDING
    # ==========================

    existing_transfer = TicketTransfer.query.filter(
        TicketTransfer.ticket_id == ticket.id,
        TicketTransfer.status == "pending"
    ).first()

    if existing_transfer:

        # ==========================
        # CEK EXPIRED
        # ==========================

        if existing_transfer.expires_at < datetime.utcnow():

            existing_transfer.status = "expired"

            db.session.commit()

        else:

            return jsonify({
                "status": "error",
                "message": "Ticket sedang dalam proses transfer"
            }), 400

    # ==========================
    # CARI USER PENERIMA
    # ==========================

    receiver = User.query.filter_by(
        email=to_email
    ).first()

    to_user_id = None

    if receiver:

        to_user_id = receiver.id

    # ==========================
    # CEK TRANSFER KE DIRI SENDIRI
    # ==========================

    if to_user_id == from_user_id:

        return jsonify({
            "status": "error",
            "message": "Tidak dapat mentransfer ticket ke diri sendiri"
        }), 400

    # ==========================
    # EXPIRED 24 JAM
    # ==========================

    expires_at = (
        datetime.utcnow()
        + timedelta(hours=24)
    )

    # ==========================
    # BUAT TRANSFER
    # ==========================

    transfer = TicketTransfer(
        ticket_id=ticket.id,
        from_user_id=from_user_id,
        to_email=to_email,
        to_user_id=to_user_id,
        status="pending",
        expires_at=expires_at
    )

    db.session.add(transfer)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transfer ticket berhasil dibuat",
        "data": transfer.to_dict()
    }), 201


# =========================================================
# GET ALL TRANSFERS
# =========================================================

@jwt_required()
def get_transfers():

    transfers = TicketTransfer.query.order_by(
        TicketTransfer.id.desc()
    ).all()

    # ==========================
    # AUTO EXPIRED
    # ==========================

    now = datetime.utcnow()

    changed = False

    for transfer in transfers:

        if (
            transfer.status == "pending"
            and transfer.expires_at < now
        ):

            transfer.status = "expired"

            changed = True

    if changed:

        db.session.commit()

    return jsonify({
        "status": "success",
        "data": [
            transfer.to_dict()
            for transfer in transfers
        ]
    }), 200


# =========================================================
# GET TRANSFER DETAIL
# =========================================================

@jwt_required()
def get_transfer(id):

    transfer = db.session.get(
        TicketTransfer,
        id
    )

    if not transfer:

        return jsonify({
            "status": "error",
            "message": "Transfer tidak ditemukan"
        }), 404

    # ==========================
    # AUTO EXPIRED
    # ==========================

    if (
        transfer.status == "pending"
        and transfer.expires_at < datetime.utcnow()
    ):

        transfer.status = "expired"

        db.session.commit()

    return jsonify({
        "status": "success",
        "data": transfer.to_dict()
    }), 200


# =========================================================
# ACCEPT TRANSFER
# =========================================================

@jwt_required()
def accept_transfer(id):

    # ==========================
    # USER DARI JWT
    # ==========================

    current_user_id = get_current_user_id()

    # ==========================
    # CARI TRANSFER
    # ==========================

    transfer = db.session.get(
        TicketTransfer,
        id
    )

    if not transfer:

        return jsonify({
            "status": "error",
            "message": "Transfer tidak ditemukan"
        }), 404

    # ==========================
    # CEK STATUS
    # ==========================

    if transfer.status != "pending":

        return jsonify({
            "status": "error",
            "message": "Transfer sudah tidak dapat diterima",
            "transfer_status": transfer.status
        }), 400

    # ==========================
    # CEK EXPIRED
    # ==========================

    if transfer.expires_at < datetime.utcnow():

        transfer.status = "expired"

        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Transfer sudah expired"
        }), 400

    # ==========================
    # CARI USER YANG LOGIN
    # ==========================

    receiver = db.session.get(
        User,
        current_user_id
    )

    if not receiver:

        return jsonify({
            "status": "error",
            "message": "User penerima tidak ditemukan"
        }), 404

    # ==========================
    # CEK EMAIL PENERIMA
    # ==========================

    if receiver.email != transfer.to_email:

        return jsonify({
            "status": "error",
            "message": "Transfer ini bukan ditujukan untuk akun Anda"
        }), 403

    # ==========================
    # CARI TICKET
    # ==========================

    ticket = db.session.get(
        Ticket,
        transfer.ticket_id
    )

    if not ticket:

        return jsonify({
            "status": "error",
            "message": "Ticket tidak ditemukan"
        }), 404

    # ==========================
    # CEK STATUS TICKET
    # ==========================

    if ticket.status == "used":

        transfer.status = "cancelled"

        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Ticket sudah digunakan"
        }), 400

    if ticket.status == "cancelled":

        transfer.status = "cancelled"

        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Ticket sudah dibatalkan"
        }), 400

    # ==========================
    # CEK PEMILIK MASIH SAMA
    # ==========================

    if ticket.owner_user_id != transfer.from_user_id:

        transfer.status = "cancelled"

        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Pemilik ticket sudah berubah"
        }), 400

    # ==========================
    # UPDATE TRANSFER
    # ==========================

    transfer.to_user_id = receiver.id

    transfer.status = "accepted"

    # ==========================
    # PINDAHKAN OWNER TICKET
    # ==========================

    ticket.owner_user_id = receiver.id

    ticket.owner_name = getattr(
        receiver,
        "full_name",
        None
    )

    ticket.status = "transferred"

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transfer ticket berhasil diterima",

        "data": {
            "transfer": transfer.to_dict(),
            "ticket": ticket.to_dict()
        }

    }), 200


# =========================================================
# CANCEL TRANSFER
# =========================================================

@jwt_required()
def cancel_transfer(id):

    # ==========================
    # USER DARI JWT
    # ==========================

    current_user_id = get_current_user_id()

    # ==========================
    # CARI TRANSFER
    # ==========================

    transfer = db.session.get(
        TicketTransfer,
        id
    )

    if not transfer:

        return jsonify({
            "status": "error",
            "message": "Transfer tidak ditemukan"
        }), 404

    # ==========================
    # CEK PEMILIK / PENGIRIM
    # ==========================

    if transfer.from_user_id != current_user_id:

        return jsonify({
            "status": "error",
            "message": "Anda bukan pengirim transfer ini"
        }), 403

    # ==========================
    # CEK STATUS
    # ==========================

    if transfer.status != "pending":

        return jsonify({
            "status": "error",
            "message": "Transfer sudah tidak dapat dibatalkan",
            "transfer_status": transfer.status
        }), 400

    # ==========================
    # CANCEL
    # ==========================

    transfer.status = "cancelled"

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Transfer berhasil dibatalkan",
        "data": transfer.to_dict()
    }), 200