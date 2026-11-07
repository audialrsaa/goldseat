import hashlib
import hmac

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

from sqlalchemy import or_, cast, String

from app.extensions import db

from app.models.order import Order
from app.models.payment import Payment
from app.models.ticket import Ticket
from app.models.user import User

from app.services.payment_service import (
    create_snap_transaction,
    get_transaction_status
)

from app.services.ticket_service import (
    generate_tickets_for_order
)


# =========================================================
# HELPER: GET CURRENT USER
# =========================================================

def get_authenticated_user():
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None, (
            jsonify({
                "status": "error",
                "message": "User ID pada token tidak valid"
            }),
            401
        )

    user = db.session.get(User, user_id)

    if not user:
        return None, (
            jsonify({
                "status": "error",
                "message": "User tidak ditemukan"
            }),
            401
        )

    return user, None


# =========================================================
# HELPER: CHECK SUPER ADMIN
# =========================================================


def is_super_admin(user):
    if not user:
        return False

    # Cek role langsung dari model User
    role = str(
        getattr(user, "role", "") or ""
    ).strip().lower().replace("-", "_").replace(" ", "_")

    if role in ("super_admin", "superadmin"):
        return True

    # Cek role melalui relasi jika model menyediakan role_id
    role_id = getattr(user, "role_id", None)

    if role_id is not None:
        role_id = str(role_id).strip()
        if role_id == "1":
            return True

    return False



# =========================================================
# GET ALL PAYMENTS - SUPER ADMIN
# =========================================================

@jwt_required()
def get_payments():
    user, error_response = get_authenticated_user()

    if error_response:
        return error_response

    current_app.logger.warning(
        "DEBUG PAYMENT ACCESS | user_id=%s | role=%r | role_id=%r",
        user.id,
        getattr(user, "role", None),
        getattr(user, "role_id", None),
    )

    if not is_super_admin(user):
        return jsonify({
            "status": "error",
            "message": "Akses khusus Super Admin"
        }), 403

    try:
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get(
            "per_page",
            default=20,
            type=int
        )

        if page is None or per_page is None:
            return jsonify({
                "status": "error",
                "message": "Parameter pagination tidak valid"
            }), 400

        if page < 1 or per_page < 1:
            return jsonify({
                "status": "error",
                "message": "Page dan per_page harus lebih dari 0"
            }), 400

        per_page = min(per_page, 100)

        status = request.args.get(
            "status", ""
        ).strip().lower()

        keyword = request.args.get(
            "search", ""
        ).strip()

        valid_statuses = {
            "pending",
            "success",
            "failed",
            "expired"
        }

        query = Payment.query

        if status:
            if status not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": "Filter status tidak valid"
                }), 400

            query = query.filter(
                Payment.status == status
            )

        if keyword:
            pattern = f"%{keyword}%"

            query = query.outerjoin(
                Order,
                Payment.order_id == Order.id
            )

            query = query.outerjoin(
                User,
                Order.user_id == User.id
            )

            query = query.filter(
                or_(
                    cast(Payment.id, String).ilike(pattern),
                    cast(Payment.order_id, String).ilike(pattern),
                    Payment.transaction_id.ilike(pattern),
                    Payment.provider.ilike(pattern),
                    Order.order_number.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern)
                )
            )

        total = query.count()

        payments = (
            query
            .order_by(
                Payment.created_at.desc(),
                Payment.id.desc()
            )
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        payment_data = []

        for payment in payments:
            item = payment.to_dict()
            order = payment.order

            item["order"] = None
            item["user"] = None

            if order:
                item["order"] = {
                    "id": order.id,
                    "order_number": order.order_number,
                    "status": order.status,
                    "total": (
                        float(order.total)
                        if order.total is not None
                        else 0
                    )
                }

                customer = order.user

                if customer:
                    item["user"] = {
                        "id": customer.id,
                        "full_name": getattr(
                            customer,
                            "full_name",
                            None
                        ),
                        "email": getattr(
                            customer,
                            "email",
                            None
                        )
                    }

                # Jangan kirim raw_response ke daftar admin.
                # Isinya dapat memuat data internal gateway.
                item.pop("raw_response", None)

            payment_data.append(item)

        return jsonify({
            "status": "success",
            "message": "Data pembayaran berhasil diambil",
            "data": {
                "payments": payment_data,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": (
                        (total + per_page - 1) // per_page
                    )
                }
            }
        }), 200

    except Exception:
        current_app.logger.exception(
            "Gagal mengambil daftar pembayaran"
        )

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil daftar pembayaran"
        }), 500


# =========================================================
# PAYMENT SUMMARY - SUPER ADMIN
# =========================================================

@jwt_required()
def get_payment_summary():
    user, error_response = get_authenticated_user()

    if error_response:
        return error_response

    if not is_super_admin(user):
        return jsonify({
            "status": "error",
            "message": "Akses khusus Super Admin"
        }), 403

    try:
        total = Payment.query.count()

        pending = Payment.query.filter_by(
            status="pending"
        ).count()

        success = Payment.query.filter_by(
            status="success"
        ).count()

        failed = Payment.query.filter_by(
            status="failed"
        ).count()

        expired = Payment.query.filter_by(
            status="expired"
        ).count()

        from sqlalchemy import func

        revenue = (
            db.session.query(
                func.coalesce(
                    func.sum(Payment.amount), 0
                )
            )
            .filter(
                Payment.status == "success"
            )
            .scalar()
        )

        return jsonify({
            "status": "success",
            "message": "Ringkasan pembayaran berhasil diambil",
            "data": {
                "total_payments": total,
                "pending": pending,
                "success": success,
                "failed": failed,
                "expired": expired,
                "total_revenue": float(revenue or 0)
            }
        }), 200

    except Exception:
        current_app.logger.exception(
            "Gagal mengambil ringkasan pembayaran"
        )

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil ringkasan pembayaran"
        }), 500


# =========================================================
# CREATE PAYMENT
# =========================================================

@jwt_required()
def create_payment():
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "User ID pada token tidak valid"
        }), 401

    data = request.get_json(silent=True) or {}
    order_id = data.get("order_id")

    if not order_id:
        return jsonify({
            "status": "error",
            "message": "Order ID wajib diisi"
        }), 400

    try:
        order_id = int(order_id)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Order ID tidak valid"
        }), 400

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    if int(order.user_id) != user_id:
        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki order ini"
        }), 403

    if order.status != "pending":
        return jsonify({
            "status": "error",
            "message": "Order tidak dapat dibayar",
            "order_status": order.status
        }), 400

    if order.total is None or order.total <= 0:
        return jsonify({
            "status": "error",
            "message": "Total order harus lebih dari 0"
        }), 400

    existing_payment = (
        Payment.query
        .filter_by(
            order_id=order.id,
            provider="midtrans",
            status="pending"
        )
        .order_by(Payment.id.desc())
        .first()
    )

    if existing_payment:
        raw_response = existing_payment.raw_response or {}

        return jsonify({
            "status": "success",
            "message": "Payment untuk order ini sudah dibuat",
            "data": {
                "payment": existing_payment.to_dict(),
                "snap_token": raw_response.get("token"),
                "redirect_url": raw_response.get("redirect_url")
            }
        }), 200

    user = order.user

    if not user:
        return jsonify({
            "status": "error",
            "message": "User pemilik order tidak ditemukan"
        }), 404

    customer = {
        "first_name": (
            getattr(user, "full_name", None)
            or getattr(user, "name", None)
            or "Customer"
        ),
        "last_name": "",
        "email": getattr(user, "email", None),
        "phone": getattr(user, "phone", None)
    }

    payment = Payment(
        order_id=order.id,
        provider="midtrans",
        status="pending",
        amount=order.total
    )

    try:
        db.session.add(payment)
        db.session.flush()

        transaction = create_snap_transaction(
            order_id=order.order_number,
            gross_amount=order.total,
            customer=customer
        )

        payment.raw_response = transaction
        payment.transaction_id = None

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Gagal membuat transaksi Midtrans"
        )

        return jsonify({
            "status": "error",
            "message": "Gagal membuat transaksi Midtrans"
        }), 500

    return jsonify({
        "status": "success",
        "message": "Payment berhasil dibuat",
        "data": {
            "payment": payment.to_dict(),
            "snap_token": transaction.get("token"),
            "redirect_url": transaction.get("redirect_url")
        }
    }), 201


# =========================================================
# MIDTRANS NOTIFICATION
# =========================================================

def payment_notification():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "status": "error",
            "message": "Notification kosong"
        }), 400

    order_number = data.get("order_id")
    status_code = data.get("status_code")
    gross_amount = data.get("gross_amount")
    signature_key = data.get("signature_key")

    if not all([
        order_number,
        status_code,
        gross_amount,
        signature_key
    ]):
        return jsonify({
            "status": "error",
            "message": "Data notification tidak lengkap"
        }), 400

    server_key = current_app.config.get(
        "MIDTRANS_SERVER_KEY"
    )

    if not server_key:
        return jsonify({
            "status": "error",
            "message": "Midtrans server key belum dikonfigurasi"
        }), 500

    signature_string = (
        str(order_number)
        + str(status_code)
        + str(gross_amount)
        + str(server_key)
    )

    expected_signature = hashlib.sha512(
        signature_string.encode("utf-8")
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        str(signature_key)
    ):
        return jsonify({
            "status": "error",
            "message": "Signature notification tidak valid"
        }), 403

    order = Order.query.filter_by(
        order_number=order_number
    ).first()

    if not order:
        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    try:
        from decimal import Decimal, InvalidOperation

        notification_amount = Decimal(str(gross_amount))
        order_amount = Decimal(str(order.total))

    except (InvalidOperation, TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Gross amount tidak valid"
        }), 400

    if notification_amount != order_amount:
        return jsonify({
            "status": "error",
            "message": "Gross amount tidak sesuai dengan order"
        }), 400

    payment = (
        Payment.query
        .filter_by(
            order_id=order.id,
            provider="midtrans"
        )
        .order_by(Payment.id.desc())
        .first()
    )

    if not payment:
        return jsonify({
            "status": "error",
            "message": "Payment tidak ditemukan"
        }), 404

    transaction_status = data.get("transaction_status")
    fraud_status = data.get("fraud_status")

    payment.raw_response = data

    transaction_id = data.get("transaction_id")

    if transaction_id:
        payment.transaction_id = transaction_id

    payment_method = map_payment_method(
        data.get("payment_type")
    )

    if payment_method:
        payment.payment_method = payment_method

    payment_success = (
        transaction_status == "settlement"
        or (
            transaction_status == "capture"
            and fraud_status == "accept"
        )
    )

    try:
        if payment_success:
            if payment.status != "success":
                payment.status = "success"
                payment.paid_at = datetime.utcnow()
                order.status = "paid"

                existing_ticket = (
                    Ticket.query
                    .join(Ticket.order_item)
                    .filter(
                        Ticket.order_item.has(
                            order_id=order.id
                        )
                    )
                    .first()
                )

                if not existing_ticket:
                    owner_name = None

                    if order.user:
                        owner_name = (
                            getattr(order.user, "full_name", None)
                            or getattr(order.user, "name", None)
                        )

                    generate_tickets_for_order(
                        order=order,
                        owner_name=owner_name
                    )

        elif transaction_status == "pending":
            if payment.status not in ("success", "expired", "failed"):
                payment.status = "pending"
                if order.status != "paid":
                    order.status = "pending"

        elif transaction_status == "expire":
            if payment.status != "success":
                payment.status = "expired"
                if order.status != "paid":
                    order.status = "expired"

        elif transaction_status in ("deny", "cancel"):
            if payment.status != "success":
                payment.status = "failed"
                if order.status != "paid":
                    order.status = "cancelled"

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Gagal memproses notifikasi Midtrans"
        )

        return jsonify({
            "status": "error",
            "message": "Gagal memproses notification payment"
        }), 500

    return jsonify({
        "status": "success",
        "message": "Notification berhasil diproses"
    }), 200


# =========================================================
# GET TRANSACTION STATUS
# =========================================================

@jwt_required()
def transaction_status():
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "User ID pada token tidak valid"
        }), 401

    data = request.get_json(silent=True) or {}

    order_id = (
        data.get("order_id")
        or request.args.get("order_id")
    )

    if not order_id:
        return jsonify({
            "status": "error",
            "message": "Order ID wajib diisi"
        }), 400

    try:
        order_id = int(order_id)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Order ID tidak valid"
        }), 400

    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({
            "status": "error",
            "message": "Order tidak ditemukan"
        }), 404

    if int(order.user_id) != user_id:
        return jsonify({
            "status": "error",
            "message": "Anda tidak memiliki order ini"
        }), 403

    try:
        result = get_transaction_status(
            order.order_number
        )

    except Exception:
        current_app.logger.exception(
            "Gagal mengambil status transaksi Midtrans"
        )

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil status transaksi Midtrans"
        }), 500

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

def map_payment_method(payment_type):
    mapping = {
        "bank_transfer": "va",
        "echannel": "va",
        "cstore": "cash",
        "credit_card": "credit_card",
        "gopay": "ewallet",
        "shopeepay": "ewallet",
        "qris": "qris"
    }

    return mapping.get(payment_type)
