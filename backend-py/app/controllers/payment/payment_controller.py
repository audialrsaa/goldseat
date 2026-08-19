import hashlib
from datetime import datetime

from flask import (
    request,
    jsonify,
    current_app
)

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.extensions import db

from app.models.order import Order
from app.models.payment import Payment
from app.models.ticket import Ticket

from app.services.payment_service import (
    create_snap_transaction,
    get_transaction_status
)

from app.services.ticket_service import (
    generate_tickets_for_order
)


# =========================================================
# CREATE PAYMENT
# =========================================================

@jwt_required()
def create_payment():

    # =====================================================
    # USER DARI JWT
    # =====================================================

    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "status": "error",
            "message": "User ID pada token tidak valid"
        }), 401

    data = request.get_json() or {}

    order_id = data.get(
        "order_id"
    )

    # =====================================================
    # VALIDASI
    # =====================================================

    if not order_id:

        return jsonify({
            "status": "error",
            "message": "Order ID wajib diisi"
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

    if int(order.user_id) != int(user_id):

        return jsonify({
            "status": "error",
            "message": (
                "Anda tidak memiliki order ini"
            )
        }), 403

    # =====================================================
    # CEK STATUS ORDER
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Order tidak dapat dibayar"
            ),
            "order_status": order.status
        }), 400

    # =====================================================
    # CEK TOTAL
    # =====================================================

    if order.total is None:

        return jsonify({
            "status": "error",
            "message": (
                "Total order belum tersedia"
            )
        }), 400

    if order.total <= 0:

        return jsonify({
            "status": "error",
            "message": (
                "Total order harus lebih dari 0"
            )
        }), 400

    # =====================================================
    # CEK PAYMENT PENDING
    #
    # Kalau user klik bayar dua kali,
    # jangan buat transaksi Midtrans baru.
    # =====================================================

    existing_payment = Payment.query.filter_by(
        order_id=order.id,
        status="pending"
    ).order_by(
        Payment.id.desc()
    ).first()

    if existing_payment:

        raw_response = (
            existing_payment.raw_response
            or {}
        )

        return jsonify({

            "status": "success",

            "message": (
                "Payment untuk order ini "
                "sudah dibuat"
            ),

            "data": {

                "payment":
                    existing_payment.to_dict(),

                "snap_token":
                    raw_response.get(
                        "token"
                    ),

                "redirect_url":
                    raw_response.get(
                        "redirect_url"
                    )
            }

        }), 200

    # =====================================================
    # USER
    # =====================================================

    user = order.user

    if not user:

        return jsonify({
            "status": "error",
            "message": (
                "User pemilik order "
                "tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CUSTOMER MIDTRANS
    # =====================================================

    customer = {

        "first_name": getattr(
            user,
            "full_name",
            None
        ),

        "last_name": "",

        "email": getattr(
            user,
            "email",
            None
        ),

        "phone": getattr(
            user,
            "phone",
            None
        )
    }

    # =====================================================
    # CREATE PAYMENT
    # =====================================================

    payment = Payment(

        order_id=order.id,

        provider="midtrans",

        status="pending",

        amount=order.total
    )

    db.session.add(
        payment
    )

    db.session.flush()

    # =====================================================
    # CREATE MIDTRANS SNAP
    # =====================================================

    try:

        transaction = create_snap_transaction(

            order_id=order.order_number,

            gross_amount=order.total,

            customer=customer
        )

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "status": "error",

            "message": (
                "Gagal membuat "
                "transaksi Midtrans"
            ),

            "error": str(e)

        }), 500

    # =====================================================
    # SIMPAN RESPONSE MIDTRANS
    # =====================================================

    payment.raw_response = (
        transaction
    )

    # Transaction ID biasanya baru tersedia
    # dari notification Midtrans.

    payment.transaction_id = None

    # =====================================================
    # COMMIT
    # =====================================================

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "status": "error",

            "message": (
                "Gagal menyimpan payment"
            ),

            "error": str(e)

        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Payment berhasil dibuat"
        ),

        "data": {

            "payment":
                payment.to_dict(),

            "snap_token":
                transaction.get(
                    "token"
                ),

            "redirect_url":
                transaction.get(
                    "redirect_url"
                )
        }

    }), 201


# =========================================================
# MIDTRANS NOTIFICATION
# =========================================================

def payment_notification():

    # =====================================================
    # NOTIFICATION DARI MIDTRANS
    #
    # Tidak menggunakan JWT.
    # Karena endpoint ini dipanggil oleh Midtrans.
    # =====================================================

    data = request.get_json()

    if not data:

        return jsonify({

            "status": "error",

            "message": (
                "Notification kosong"
            )

        }), 400

    # =====================================================
    # DATA NOTIFICATION
    # =====================================================

    order_number = data.get(
        "order_id"
    )

    status_code = data.get(
        "status_code"
    )

    gross_amount = data.get(
        "gross_amount"
    )

    signature_key = data.get(
        "signature_key"
    )

    # =====================================================
    # VALIDASI
    # =====================================================

    if not all([
        order_number,
        status_code,
        gross_amount,
        signature_key
    ]):

        return jsonify({

            "status": "error",

            "message": (
                "Data notification "
                "tidak lengkap"
            )

        }), 400

    # =====================================================
    # VERIFY SIGNATURE
    # =====================================================

    server_key = current_app.config.get(
        "MIDTRANS_SERVER_KEY"
    )

    if not server_key:

        return jsonify({

            "status": "error",

            "message": (
                "Midtrans server key "
                "belum dikonfigurasi"
            )

        }), 500

    signature_string = (
        str(order_number)
        + str(status_code)
        + str(gross_amount)
        + str(server_key)
    )

    expected_signature = (
        hashlib.sha512(
            signature_string.encode(
                "utf-8"
            )
        ).hexdigest()
    )

    if not hashlib.compare_digest(
        expected_signature,
        signature_key
    ):

        return jsonify({

            "status": "error",

            "message": (
                "Signature notification "
                "tidak valid"
            )

        }), 403

    # =====================================================
    # CARI ORDER
    # =====================================================

    order = Order.query.filter_by(
        order_number=order_number
    ).first()

    if not order:

        return jsonify({

            "status": "error",

            "message": (
                "Order tidak ditemukan"
            )

        }), 404

    # =====================================================
    # VALIDASI GROSS AMOUNT
    #
    # Jangan sampai notification mengatakan
    # nominal berbeda dari order kita.
    # =====================================================

    try:

        notification_amount = float(
            gross_amount
        )

        order_amount = float(
            order.total
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({

            "status": "error",

            "message": (
                "Gross amount tidak valid"
            )

        }), 400

    if notification_amount != order_amount:

        return jsonify({

            "status": "error",

            "message": (
                "Gross amount "
                "tidak sesuai dengan order"
            )

        }), 400

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

            "message": (
                "Payment tidak ditemukan"
            )

        }), 404

    # =====================================================
    # DATA MIDTRANS
    # =====================================================

    transaction_status = data.get(
        "transaction_status"
    )

    fraud_status = data.get(
        "fraud_status"
    )

    transaction_id = data.get(
        "transaction_id"
    )

    payment_type = data.get(
        "payment_type"
    )

    # =====================================================
    # SIMPAN RAW RESPONSE
    # =====================================================

    payment.raw_response = data

    # =====================================================
    # TRANSACTION ID
    # =====================================================

    if transaction_id:

        payment.transaction_id = (
            transaction_id
        )

    # =====================================================
    # PAYMENT METHOD
    # =====================================================

    payment_method = (
        map_payment_method(
            payment_type
        )
    )

    if payment_method:

        payment.payment_method = (
            payment_method
        )

    # =====================================================
    # SUCCESS
    # =====================================================

    payment_success = False

    if transaction_status == "settlement":

        # ================================================
        # Kalau sebelumnya sudah success,
        # jangan generate ticket lagi.
        # ================================================

        if payment.status != "success":

            payment.status = "success"

            payment.paid_at = (
                datetime.utcnow()
            )

            order.status = "paid"

            payment_success = True

    # =====================================================
    # CREDIT CARD CAPTURE
    # =====================================================

    elif transaction_status == "capture":

        if fraud_status == "accept":

            if payment.status != "success":

                payment.status = "success"

                payment.paid_at = (
                    datetime.utcnow()
                )

                order.status = "paid"

                payment_success = True

    # =====================================================
    # PENDING
    # =====================================================

    elif transaction_status == "pending":

        # Jangan mengubah payment success
        # kembali menjadi pending.

        if payment.status != "success":

            payment.status = "pending"

            order.status = "pending"

    # =====================================================
    # EXPIRED
    # =====================================================

    elif transaction_status == "expire":

        # Jangan mengubah payment success
        # kembali menjadi expired.

        if payment.status != "success":

            payment.status = "expired"

            order.status = "expired"

    # =====================================================
    # DENY
    # =====================================================

    elif transaction_status == "deny":

        if payment.status != "success":

            payment.status = "failed"

            order.status = "cancelled"

    # =====================================================
    # CANCEL
    # =====================================================

    elif transaction_status == "cancel":

        if payment.status != "success":

            payment.status = "failed"

            order.status = "cancelled"

    # =====================================================
    # GENERATE TICKET
    #
    # HANYA ketika status berubah menjadi success.
    # =====================================================

    if payment_success:

        # ================================================
        # CEK APAKAH TICKET SUDAH PERNAH DIBUAT
        # ================================================

        existing_ticket = (
            Ticket.query
            .join(
                Ticket.order_item
            )
            .filter(
                Ticket.order_item.has(
                    order_id=order.id
                )
            )
            .first()
        )

        # ================================================
        # GENERATE
        # ================================================

        if not existing_ticket:

            owner_name = None

            if order.user:

                owner_name = getattr(
                    order.user,
                    "full_name",
                    None
                )

            try:

                generate_tickets_for_order(

                    order=order,

                    owner_name=owner_name
                )

            except Exception as e:

                db.session.rollback()

                return jsonify({

                    "status": "error",

                    "message": (
                        "Payment berhasil, "
                        "tetapi gagal "
                        "generate ticket"
                    ),

                    "error": str(e)

                }), 500

    # =====================================================
    # COMMIT
    # =====================================================

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "status": "error",

            "message": (
                "Gagal menyimpan "
                "notification payment"
            ),

            "error": str(e)

        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Notification berhasil "
            "diproses"
        )

    }), 200


# =========================================================
# GET TRANSACTION STATUS
# =========================================================

@jwt_required()
def transaction_status():

    # =====================================================
    # USER DARI JWT
    # =====================================================

    user_id = get_jwt_identity()

    try:

        user_id = int(user_id)

    except (
        TypeError,
        ValueError
    ):

        return jsonify({

            "status": "error",

            "message": (
                "User ID pada token "
                "tidak valid"
            )

        }), 401

    data = request.get_json(
        silent=True
    ) or {}

    order_id = data.get(
        "order_id"
    )

    # =====================================================
    # VALIDASI
    # =====================================================

    if not order_id:

        return jsonify({

            "status": "error",

            "message": (
                "Order ID wajib diisi"
            )

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

            "message": (
                "Order tidak ditemukan"
            )

        }), 404

    # =====================================================
    # CEK OWNER
    # =====================================================

    if int(order.user_id) != int(user_id):

        return jsonify({

            "status": "error",

            "message": (
                "Anda tidak memiliki "
                "order ini"
            )

        }), 403

    # =====================================================
    # MIDTRANS STATUS
    # =====================================================

    try:

        result = get_transaction_status(
            order.order_number
        )

    except Exception as e:

        return jsonify({

            "status": "error",

            "message": (
                "Gagal mengambil "
                "status transaksi Midtrans"
            ),

            "error": str(e)

        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "data": {

            "order": order.to_dict(),

            "midtrans": result

        }

    }), 200


# =========================================================
# MAP PAYMENT METHOD
# =========================================================

def map_payment_method(
    payment_type
):

    mapping = {

        "bank_transfer":
            "va",

        "echannel":
            "va",

        "cstore":
            "cash",

        "credit_card":
            "credit_card",

        "gopay":
            "ewallet",

        "shopeepay":
            "ewallet",

        "qris":
            "qris"

    }

    return mapping.get(
        payment_type
    )