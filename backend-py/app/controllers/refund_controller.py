from datetime import datetime
from decimal import Decimal

from flask import request, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db

from app.models.refund import Refund
from app.models.order import Order
from app.models.payment import Payment

from app.utils.auth import get_current_user_id

from app.services.payment_service import (
    refund_transaction
)


# =========================================================
# CREATE REFUND REQUEST
# =========================================================

@jwt_required()
def create_refund():

    data = request.get_json() or {}

    order_id = data.get("order_id")
    reason = data.get("reason")
    amount = data.get("amount")
    refund_method = data.get("refund_method")

    # =====================================================
    # USER DARI JWT
    # =====================================================

    requested_by = get_current_user_id()

    # =====================================================
    # VALIDASI
    # =====================================================

    if not order_id:

        return jsonify({
            "status": "error",
            "message": "Order ID wajib diisi"
        }), 400

    if not reason:

        return jsonify({
            "status": "error",
            "message": "Alasan refund wajib diisi"
        }), 400

    if amount is None:

        return jsonify({
            "status": "error",
            "message": "Amount refund wajib diisi"
        }), 400

    if not refund_method:

        return jsonify({
            "status": "error",
            "message": "Refund method wajib diisi"
        }), 400

    # =====================================================
    # VALIDASI REFUND METHOD
    # =====================================================

    allowed_methods = [
        "original_payment",
        "bank_transfer",
        "wallet_credit"
    ]

    if refund_method not in allowed_methods:

        return jsonify({
            "status": "error",
            "message": "Refund method tidak valid",
            "allowed": allowed_methods
        }), 400

    # =====================================================
    # VALIDASI AMOUNT
    # =====================================================

    try:

        amount = Decimal(str(amount))

    except Exception:

        return jsonify({
            "status": "error",
            "message": "Amount harus berupa angka"
        }), 400

    if amount <= 0:

        return jsonify({
            "status": "error",
            "message": "Amount refund harus lebih dari 0"
        }), 400

    # =====================================================
    # CARI ORDER
    # =====================================================

    order = db.session.get(
        Order,
        order_id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CEK PEMILIK ORDER
    # =====================================================

    if order.user_id != requested_by:

        return jsonify({
            "status": "error",
            "message": "Anda bukan pemilik order ini"
        }), 403

    # =====================================================
    # CEK STATUS ORDER
    # =====================================================

    if order.status != "paid":

        return jsonify({
            "status": "error",
            "message": "Order belum dapat direfund",
            "order_status": order.status
        }), 400

    # =====================================================
    # CEK AMOUNT TIDAK MELEBIHI TOTAL ORDER
    # =====================================================

    if amount > Decimal(str(order.total)):

        return jsonify({
            "status": "error",
            "message": "Amount refund melebihi total order",
            "order_total": float(order.total)
        }), 400

    # =====================================================
    # CEK REFUND YANG MASIH AKTIF
    # =====================================================

    existing_refund = Refund.query.filter(
        Refund.order_id == order.id,
        Refund.status.in_([
            "requested",
            "approved"
        ])
    ).first()

    if existing_refund:

        return jsonify({
            "status": "error",
            "message": "Order sudah memiliki refund yang sedang diproses",
            "refund": existing_refund.to_dict()
        }), 400

    # =====================================================
    # HITUNG TOTAL REFUND SEBELUMNYA
    # =====================================================

    previous_refunds = Refund.query.filter(
        Refund.order_id == order.id,
        Refund.status == "processed"
    ).all()

    previous_refund_amount = sum(
        Decimal(str(refund.amount))
        for refund in previous_refunds
    )

    remaining_amount = (
        Decimal(str(order.total))
        - previous_refund_amount
    )

    if amount > remaining_amount:

        return jsonify({
            "status": "error",
            "message": "Amount refund melebihi sisa nominal yang dapat direfund",
            "remaining_amount": float(remaining_amount)
        }), 400

    # =====================================================
    # BUAT REFUND REQUEST
    # =====================================================

    refund = Refund(
        order_id=order.id,
        requested_by=requested_by,
        reason=reason,
        amount=amount,
        status="requested",
        refund_method=refund_method
    )

    db.session.add(refund)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Permintaan refund berhasil dibuat",
        "data": refund.to_dict()
    }), 201


# =========================================================
# GET ALL REFUNDS
# =========================================================

@jwt_required()
def get_refunds():

    refunds = Refund.query.order_by(
        Refund.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            refund.to_dict()
            for refund in refunds
        ]
    }), 200


# =========================================================
# GET REFUND DETAIL
# =========================================================

@jwt_required()
def get_refund(id):

    refund = db.session.get(
        Refund,
        id
    )

    if not refund:

        return jsonify({
            "status": "error",
            "message": "Refund tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": refund.to_dict()
    }), 200


# =========================================================
# APPROVE REFUND
# =========================================================

@jwt_required()
def approve_refund(id):

    # =====================================================
    # ADMIN / EVENT MANAGER DARI JWT
    # =====================================================

    processed_by = get_current_user_id()

    # =====================================================
    # CARI REFUND
    # =====================================================

    refund = db.session.get(
        Refund,
        id
    )

    if not refund:

        return jsonify({
            "status": "error",
            "message": "Refund tidak ditemukan"
        }), 404

    # =====================================================
    # CEK STATUS
    # =====================================================

    if refund.status != "requested":

        return jsonify({
            "status": "error",
            "message": "Refund tidak dapat disetujui",
            "refund_status": refund.status
        }), 400

    # =====================================================
    # CARI ORDER
    # =====================================================

    order = db.session.get(
        Order,
        refund.order_id
    )

    if not order:

        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    # =====================================================
    # CARI PAYMENT
    # =====================================================

    payment = Payment.query.filter_by(
        order_id=order.id,
        provider="midtrans"
    ).order_by(
        Payment.id.desc()
    ).first()

    if not payment:

        return jsonify({
            "status": "error",
            "message": "Payment Midtrans tidak ditemukan"
        }), 404

    # =====================================================
    # CEK TRANSACTION
    # =====================================================

    transaction_id = payment.transaction_id

    if not transaction_id:

        return jsonify({
            "status": "error",
            "message": "Transaction ID Midtrans belum tersedia"
        }), 400

    # =====================================================
    # CEK PAYMENT STATUS
    # =====================================================

    if payment.status != "success":

        return jsonify({
            "status": "error",
            "message": "Payment belum berhasil sehingga belum dapat direfund",
            "payment_status": payment.status
        }), 400

    # =====================================================
    # REFUND METHOD
    # =====================================================

    if refund.refund_method != "original_payment":

        return jsonify({
            "status": "error",
            "message": (
                "Refund method ini tidak diproses melalui "
                "Midtrans. Gunakan original_payment untuk "
                "refund otomatis Midtrans."
            )
        }), 400

    # =====================================================
    # PANGGIL MIDTRANS
    # =====================================================

    try:

        midtrans_response = refund_transaction(
            transaction_id=transaction_id,
            refund_key=f"refund-{refund.id}",
            amount=refund.amount,
            reason=refund.reason
        )

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Gagal memproses refund melalui Midtrans",
            "error": str(e)
        }), 500

    # =====================================================
    # SIMPAN HASIL MIDTRANS
    # =====================================================

    refund.status = "processed"

    refund.processed_by = processed_by

    refund.processed_at = datetime.utcnow()

    # =====================================================
    # UPDATE ORDER
    # =====================================================

    if Decimal(str(refund.amount)) >= Decimal(
        str(order.total)
    ):

        order.status = "refunded"

    else:

        order.status = "partially_refunded"

    # =====================================================
    # SIMPAN RESPONSE MIDTRANS
    # =====================================================

    if isinstance(payment.raw_response, dict):

        payment.raw_response = {
            **payment.raw_response,
            "refund": midtrans_response
        }

    else:

        payment.raw_response = {
            "refund": midtrans_response
        }

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Refund berhasil diproses melalui Midtrans Sandbox",
        "data": {
            "refund": refund.to_dict(),
            "order_status": order.status,
            "midtrans_response": midtrans_response
        }
    }), 200


# =========================================================
# REJECT REFUND
# =========================================================

@jwt_required()
def reject_refund(id):

    processed_by = get_current_user_id()

    # =====================================================
    # CARI REFUND
    # =====================================================

    refund = db.session.get(
        Refund,
        id
    )

    if not refund:

        return jsonify({
            "status": "error",
            "message": "Refund tidak ditemukan"
        }), 404

    # =====================================================
    # CEK STATUS
    # =====================================================

    if refund.status != "requested":

        return jsonify({
            "status": "error",
            "message": "Refund tidak dapat ditolak",
            "refund_status": refund.status
        }), 400

    # =====================================================
    # UPDATE
    # =====================================================

    refund.status = "rejected"

    refund.processed_by = processed_by

    refund.processed_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Refund berhasil ditolak",
        "data": refund.to_dict()
    }), 200