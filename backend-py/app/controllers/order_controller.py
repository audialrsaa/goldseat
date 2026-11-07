from datetime import datetime, timedelta

from flask import request, jsonify

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from app.extensions import db
from app.models.order import Order
from app.models.voucher import Voucher


# =========================================================
# GET ALL ORDERS - ADMIN
# =========================================================

@jwt_required()
def get_orders():
    claims = get_jwt()

    # Pastikan role admin ikut disimpan di token saat login.
    role = claims.get("role")

    allowed_roles = {
        "admin",
        "super_admin",
        "superadmin",
    }

    if role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": "Akses ditolak. Hanya admin yang dapat melihat semua pesanan.",
        }), 403

    orders = (
        Order.query
        .order_by(Order.id.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "data": [
            order.to_dict()
            for order in orders
        ],
    }), 200


# =========================================================
# GET MY ORDERS
# =========================================================

@jwt_required()
def get_my_orders():

    user_id = get_jwt_identity()

    orders = (
        Order.query
        .filter_by(
            user_id=user_id
        )
        .order_by(
            Order.id.desc()
        )
        .all()
    )

    return jsonify({
        "status": "success",
        "data": [
            order.to_dict()
            for order in orders
        ]
    }), 200


# =========================================================
# GET ORDER DETAIL
# =========================================================

@jwt_required()
def get_order(id):

    user_id = get_jwt_identity()

    order = db.session.get(
        Order,
        id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CEK PEMILIK
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke order ini"
        }), 403

    return jsonify({
        "status": "success",
        "data": order.to_dict()
    }), 200


# =========================================================
# CREATE ORDER
# =========================================================

@jwt_required()
def create_order():

    user_id = get_jwt_identity()

    data = request.get_json() or {}

    total = data.get("total")
    voucher_id = data.get("voucher_id")
    channel = data.get(
        "channel",
        "online"
    )
    notes = data.get("notes")
    idempotency_key = data.get(
        "idempotency_key"
    )

    # =====================================================
    # VALIDASI TOTAL
    # =====================================================

    if total is None:

        return jsonify({
            "status": "error",
            "message": "Total wajib diisi"
        }), 400

    try:

        total = float(total)

    except (ValueError, TypeError):

        return jsonify({
            "status": "error",
            "message": "Total harus berupa angka"
        }), 400

    if total < 0:

        return jsonify({
            "status": "error",
            "message": "Total tidak boleh negatif"
        }), 400

    # =====================================================
    # VALIDASI CHANNEL
    # =====================================================

    allowed_channels = [
        "online",
        "offline"
    ]

    if channel not in allowed_channels:

        return jsonify({
            "status": "error",
            "message": "Channel harus online atau offline"
        }), 400

    # =====================================================
    # IDEMPOTENCY KEY
    # =====================================================
    #
    # Kalau request yang sama dikirim ulang,
    # jangan membuat order baru.
    #
    # Penting:
    # idempotency key harus dicek bersama user_id
    # agar user tidak bisa mengambil order milik user lain.
    # =====================================================

    if idempotency_key:

        existing_order = (
            Order.query
            .filter_by(
                user_id=user_id,
                idempotency_key=idempotency_key
            )
            .first()
        )

        if existing_order:

            return jsonify({
                "status": "success",
                "message": "Order sudah pernah dibuat",
                "data": existing_order.to_dict()
            }), 200

    # =====================================================
    # VOUCHER
    # =====================================================

    voucher = None

    discount_amount = 0

    if voucher_id:

        voucher = db.session.get(
            Voucher,
            voucher_id
        )

        if not voucher:

            return jsonify({
                "status": "error",
                "message": "Voucher tidak ditemukan"
            }), 404

        # =================================================
        # CEK TANGGAL VOUCHER
        # =================================================

        today = datetime.utcnow().date()

        if today < voucher.start_date:

            return jsonify({
                "status": "error",
                "message": "Voucher belum dapat digunakan"
            }), 400

        if today > voucher.end_date:

            return jsonify({
                "status": "error",
                "message": "Voucher sudah tidak berlaku"
            }), 400

        # =================================================
        # CEK QUOTA
        # =================================================
        #
        # Di tahap create order kita hanya memastikan
        # quota masih tersedia.
        #
        # Quota TIDAK dikurangi di sini karena order
        # masih pending dan user belum membayar.
        #
        # Pengurangan quota sebaiknya dilakukan ketika
        # payment benar-benar success.
        # =================================================

        if voucher.quota <= 0:

            return jsonify({
                "status": "error",
                "message": "Quota voucher sudah habis"
            }), 400

        # =================================================
        # CEK MINIMUM TRANSAKSI
        # =================================================

        if total < float(
            voucher.min_transaction
        ):

            return jsonify({
                "status": "error",
                "message": (
                    f"Minimum transaksi untuk voucher "
                    f"adalah {voucher.min_transaction}"
                )
            }), 400

        # =================================================
        # HITUNG DISKON
        # =================================================

        if voucher.type == "percentage":

            discount_amount = (
                total
                * float(voucher.discount)
                / 100
            )

            # =============================================
            # MAX DISCOUNT
            # =============================================

            if voucher.max_discount is not None:

                discount_amount = min(
                    discount_amount,
                    float(
                        voucher.max_discount
                    )
                )

        elif voucher.type == "fixed":

            discount_amount = float(
                voucher.discount
            )

        else:

            return jsonify({
                "status": "error",
                "message": "Tipe voucher tidak valid"
            }), 400

        # =================================================
        # DISKON TIDAK BOLEH LEBIH BESAR DARI TOTAL
        # =================================================

        discount_amount = min(
            discount_amount,
            total
        )

    # =====================================================
    # TOTAL AKHIR
    # =====================================================

    final_total = (
        total - discount_amount
    )

    # =====================================================
    # SAFETY
    # =====================================================

    if final_total < 0:

        final_total = 0

    # =====================================================
    # GENERATE ORDER NUMBER
    # =====================================================

    timestamp = datetime.utcnow().strftime(
        "%Y%m%d%H%M%S%f"
    )

    order_number = (
        f"ORD-{timestamp}"
    )

    # =====================================================
    # PASTIKAN ORDER NUMBER UNIK
    # =====================================================

    while Order.query.filter_by(
        order_number=order_number
    ).first():

        timestamp = datetime.utcnow().strftime(
            "%Y%m%d%H%M%S%f"
        )

        order_number = (
            f"ORD-{timestamp}"
        )

    # =====================================================
    # EXPIRED PAYMENT
    # =====================================================

    expired_at = (
        datetime.utcnow()
        + timedelta(minutes=15)
    )

    # =====================================================
    # CREATE ORDER
    # =====================================================

    order = Order(

        user_id=user_id,

        order_number=order_number,

        status="pending",

        total=final_total,

        voucher_id=(
            voucher.id
            if voucher
            else None
        ),

        discount_amount=discount_amount,

        expired_at=expired_at,

        channel=channel,

        idempotency_key=idempotency_key,

        notes=notes
    )

    db.session.add(
        order
    )

    # =====================================================
    # COMMIT
    # =====================================================

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Gagal membuat order",
            "error": str(e)
        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": "Order berhasil dibuat",

        "data": order.to_dict()

    }), 201


# =========================================================
# CANCEL ORDER
# =========================================================

@jwt_required()
def cancel_order(id):

    user_id = get_jwt_identity()

    order = db.session.get(
        Order,
        id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CEK OWNER
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke order ini"
        }), 403

    # =====================================================
    # HANYA PENDING
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Hanya order pending yang "
                "dapat dibatalkan"
            )
        }), 400

    # =====================================================
    # CANCEL
    # =====================================================

    order.status = "cancelled"

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Gagal membatalkan order",
            "error": str(e)
        }), 500

    return jsonify({

        "status": "success",

        "message": "Order berhasil dibatalkan",

        "data": order.to_dict()

    }), 200


# =========================================================
# UPDATE ORDER
# =========================================================

@jwt_required()
def update_order(id):

    user_id = get_jwt_identity()

    order = db.session.get(
        Order,
        id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CEK OWNER
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke order ini"
        }), 403

    # =====================================================
    # HANYA PENDING
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Hanya order pending yang "
                "dapat diupdate"
            )
        }), 400

    data = request.get_json() or {}

    # =====================================================
    # UNTUK SEKARANG HANYA NOTES
    # =====================================================

    if "notes" in data:

        order.notes = data.get(
            "notes"
        )

    # =====================================================
    # JANGAN IZINKAN USER MENGUBAH
    # TOTAL / VOUCHER / STATUS
    # =====================================================

    protected_fields = [
        "user_id",
        "order_number",
        "status",
        "total",
        "voucher_id",
        "discount_amount",
        "channel",
        "idempotency_key",
        "expired_at"
    ]

    attempted_protected_fields = [
        field
        for field in protected_fields
        if field in data
    ]

    if attempted_protected_fields:

        return jsonify({
            "status": "error",
            "message": (
                "Field berikut tidak dapat "
                "diubah: "
                + ", ".join(
                    attempted_protected_fields
                )
            )
        }), 400

    # =====================================================
    # COMMIT
    # =====================================================

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Gagal mengupdate order",
            "error": str(e)
        }), 500

    return jsonify({

        "status": "success",

        "message": "Order berhasil diupdate",

        "data": order.to_dict()

    }), 200


# =========================================================
# DELETE ORDER
# =========================================================

@jwt_required()
def delete_order(id):

    user_id = get_jwt_identity()

    order = db.session.get(
        Order,
        id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CEK OWNER
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki akses ke order ini"
        }), 403

    # =====================================================
    # ORDER PAID TIDAK BOLEH DIHAPUS
    # =====================================================

    if order.status == "paid":

        return jsonify({
            "status": "error",
            "message": (
                "Order yang sudah dibayar "
                "tidak boleh dihapus"
            )
        }), 400

    # =====================================================
    # ORDER YANG SUDAH CANCELLED / EXPIRED
    # MASIH BOLEH DIHAPUS DARI DATABASE
    # =====================================================

    db.session.delete(
        order
    )

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Gagal menghapus order",
            "error": str(e)
        }), 500

    return jsonify({

        "status": "success",

        "message": "Order berhasil dihapus"

    }), 200