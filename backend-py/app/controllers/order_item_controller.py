from datetime import datetime
from decimal import Decimal

from flask import request, jsonify

from flask_jwt_extended import jwt_required

from app.extensions import db

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.ticket_category import TicketCategory
from app.models.voucher import Voucher

from app.utils.auth import get_current_user_id


# =========================================================
# HELPER
# HITUNG ULANG TOTAL ORDER
# =========================================================

def recalculate_order_total(order):

    # =====================================================
    # AMBIL SEMUA ORDER ITEM
    # =====================================================

    items = OrderItem.query.filter_by(
        order_id=order.id
    ).all()

    # =====================================================
    # JIKA TIDAK ADA ITEM
    # =====================================================

    if not items:

        order.total = Decimal("0")
        order.discount_amount = Decimal("0")

        return {
            "subtotal": Decimal("0"),
            "discount_amount": Decimal("0"),
            "total": Decimal("0")
        }

    # =====================================================
    # HITUNG SUBTOTAL
    # =====================================================

    subtotal = Decimal("0")

    event_ids = set()

    for item in items:

        if item.price is None:

            raise ValueError(
                "Harga order item tidak tersedia"
            )

        if item.qty <= 0:

            raise ValueError(
                "Quantity order item harus lebih dari 0"
            )

        item_subtotal = (
            Decimal(str(item.price))
            * item.qty
        )

        subtotal += item_subtotal

        # =================================================
        # AMBIL EVENT DARI TICKET CATEGORY
        # =================================================

        ticket_category = db.session.get(
            TicketCategory,
            item.ticket_category_id
        )

        if ticket_category:

            event_ids.add(
                ticket_category.event_id
            )

    # =====================================================
    # DEFAULT DISCOUNT
    # =====================================================

    discount_amount = Decimal("0")

    # =====================================================
    # VOUCHER
    # =====================================================

    voucher = None

    if order.voucher_id:

        voucher = db.session.get(
            Voucher,
            order.voucher_id
        )

        if not voucher:

            raise ValueError(
                "Voucher order tidak ditemukan"
            )

        today = datetime.utcnow().date()

        # =================================================
        # CEK TANGGAL
        # =================================================

        if today < voucher.start_date:

            raise ValueError(
                "Voucher belum dapat digunakan"
            )

        if today > voucher.end_date:

            raise ValueError(
                "Voucher sudah tidak berlaku"
            )

        # =================================================
        # CEK QUOTA
        # =================================================

        if voucher.quota <= 0:

            raise ValueError(
                "Quota voucher sudah habis"
            )

        # =================================================
        # CEK MINIMUM TRANSAKSI
        # =================================================

        if (
            voucher.min_transaction is not None
            and
            subtotal
            < Decimal(
                str(
                    voucher.min_transaction
                )
            )
        ):

            raise ValueError(
                "Minimum transaksi untuk voucher "
                f"adalah {voucher.min_transaction}"
            )

        # =================================================
        # CEK EVENT VOUCHER
        # =================================================

        if voucher.event_id:

            if voucher.event_id not in event_ids:

                raise ValueError(
                    "Voucher tidak berlaku "
                    "untuk event ini"
                )

        # =================================================
        # HITUNG DISKON PERCENTAGE
        # =================================================

        if voucher.type == "percentage":

            discount_amount = (
                subtotal
                * Decimal(
                    str(
                        voucher.discount
                    )
                )
                / Decimal("100")
            )

            # =============================================
            # MAX DISCOUNT
            # =============================================

            if voucher.max_discount is not None:

                discount_amount = min(
                    discount_amount,
                    Decimal(
                        str(
                            voucher.max_discount
                        )
                    )
                )

        # =================================================
        # HITUNG DISKON FIXED
        # =================================================

        elif voucher.type == "fixed":

            discount_amount = Decimal(
                str(
                    voucher.discount
                )
            )

        else:

            raise ValueError(
                "Tipe voucher tidak valid"
            )

        # =================================================
        # DISKON TIDAK BOLEH > SUBTOTAL
        # =================================================

        discount_amount = min(
            discount_amount,
            subtotal
        )

    # =====================================================
    # FINAL TOTAL
    # =====================================================

    final_total = (
        subtotal
        - discount_amount
    )

    if final_total < 0:

        final_total = Decimal("0")

    # =====================================================
    # UPDATE ORDER
    # =====================================================

    order.discount_amount = (
        discount_amount
    )

    order.total = final_total

    return {
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total": final_total
    }


# =========================================================
# CREATE ORDER ITEM
# =========================================================

@jwt_required()
def create_order_item():

    user_id = get_current_user_id()

    data = request.get_json() or {}

    order_id = data.get(
        "order_id"
    )

    ticket_category_id = data.get(
        "ticket_category_id"
    )

    qty = data.get(
        "qty"
    )

    # =====================================================
    # VALIDASI
    # =====================================================

    if not order_id:

        return jsonify({
            "status": "error",
            "message": "Order ID wajib diisi"
        }), 400

    if not ticket_category_id:

        return jsonify({
            "status": "error",
            "message": (
                "Ticket category ID wajib diisi"
            )
        }), 400

    if qty is None:

        return jsonify({
            "status": "error",
            "message": "Quantity wajib diisi"
        }), 400

    # =====================================================
    # PARSE QTY
    # =====================================================

    try:

        qty = int(qty)

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status": "error",
            "message": (
                "Quantity harus berupa angka"
            )
        }), 400

    if qty <= 0:

        return jsonify({
            "status": "error",
            "message": (
                "Quantity minimal 1"
            )
        }), 400

    # =====================================================
    # CEK ORDER
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
    # CEK OWNER
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": (
                "Anda tidak memiliki order ini"
            )
        }), 403

    # =====================================================
    # ORDER HARUS PENDING
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Order sudah tidak dapat diubah"
            ),
            "order_status": order.status
        }), 400

    # =====================================================
    # CEK TICKET CATEGORY
    # =====================================================

    ticket_category = db.session.get(
        TicketCategory,
        ticket_category_id
    )

    if not ticket_category:

        return jsonify({
            "status": "error",
            "message": (
                "Ticket category tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CEK ACTIVE
    # =====================================================

    if not ticket_category.active:

        return jsonify({
            "status": "error",
            "message": (
                f"Tiket {ticket_category.name} "
                "sedang tidak aktif"
            )
        }), 400

    # =====================================================
    # CEK STOCK
    # =====================================================

    available_stock = (
        ticket_category.stock
        - ticket_category.sold
    )

    if qty > available_stock:

        return jsonify({
            "status": "error",
            "message": (
                f"Stok {ticket_category.name} "
                "tidak mencukupi"
            ),
            "available_stock": available_stock
        }), 400

    # =====================================================
    # AMBIL HARGA DARI DATABASE
    # =====================================================

    price = ticket_category.price

    if price is None:

        return jsonify({
            "status": "error",
            "message": (
                "Harga ticket category "
                "tidak tersedia"
            )
        }), 400

    # =====================================================
    # CREATE ORDER ITEM
    # =====================================================

    order_item = OrderItem(

        order_id=order.id,

        ticket_category_id=(
            ticket_category.id
        ),

        qty=qty,

        # SNAPSHOT HARGA
        price=price
    )

    db.session.add(
        order_item
    )

    # =====================================================
    # FLUSH
    # Supaya item tersedia saat
    # menghitung ulang order.
    # =====================================================

    db.session.flush()

    # =====================================================
    # HITUNG ULANG TOTAL
    # =====================================================

    try:

        totals = recalculate_order_total(
            order
        )

    except ValueError as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
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
            "message": (
                "Gagal membuat order item"
            ),
            "error": str(e)
        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Order item berhasil dibuat"
        ),

        "data": {

            "order_item":
                order_item.to_dict(),

            "order": {
                "id": order.id,
                "subtotal": float(
                    totals["subtotal"]
                ),
                "discount_amount": float(
                    totals["discount_amount"]
                ),
                "total": float(
                    totals["total"]
                )
            }
        }

    }), 201


# =========================================================
# GET ALL ORDER ITEMS
# =========================================================

@jwt_required()
def get_order_items():

    user_id = get_current_user_id()

    order_items = (
        OrderItem.query
        .join(Order)
        .filter(
            Order.user_id == user_id
        )
        .order_by(
            OrderItem.id.desc()
        )
        .all()
    )

    return jsonify({

        "status": "success",

        "data": [
            item.to_dict()
            for item in order_items
        ]

    }), 200


# =========================================================
# GET ORDER ITEMS BY ORDER
# =========================================================

@jwt_required()
def get_order_items_by_order(
    order_id
):

    user_id = get_current_user_id()

    # =====================================================
    # CEK ORDER
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
    # CEK OWNER
    # =====================================================

    if str(order.user_id) != str(user_id):

        return jsonify({
            "status": "error",
            "message": (
                "Anda tidak memiliki order ini"
            )
        }), 403

    # =====================================================
    # AMBIL ITEMS
    # =====================================================

    items = (
        OrderItem.query
        .filter_by(
            order_id=order.id
        )
        .order_by(
            OrderItem.id.asc()
        )
        .all()
    )

    return jsonify({

        "status": "success",

        "data": [
            item.to_dict()
            for item in items
        ]

    }), 200


# =========================================================
# GET DETAIL
# =========================================================

@jwt_required()
def get_order_item(id):

    user_id = get_current_user_id()

    order_item = db.session.get(
        OrderItem,
        id
    )

    if not order_item:

        return jsonify({
            "status": "error",
            "message": (
                "Order item tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CEK ORDER
    # =====================================================

    order = order_item.order

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
            "message": (
                "Anda tidak memiliki "
                "order item ini"
            )
        }), 403

    return jsonify({

        "status": "success",

        "data": order_item.to_dict()

    }), 200


# =========================================================
# UPDATE ORDER ITEM
# =========================================================

@jwt_required()
def update_order_item(id):

    user_id = get_current_user_id()

    order_item = db.session.get(
        OrderItem,
        id
    )

    if not order_item:

        return jsonify({
            "status": "error",
            "message": (
                "Order item tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CEK ORDER
    # =====================================================

    order = order_item.order

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
            "message": (
                "Anda tidak memiliki "
                "order item ini"
            )
        }), 403

    # =====================================================
    # ORDER HARUS PENDING
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Order item tidak dapat diubah"
            ),
            "order_status": order.status
        }), 400

    data = request.get_json() or {}

    # =====================================================
    # PRICE TIDAK BOLEH DARI FRONTEND
    # =====================================================

    if "price" in data:

        return jsonify({
            "status": "error",
            "message": (
                "Price tidak dapat "
                "diubah langsung"
            )
        }), 400

    # =====================================================
    # UPDATE CATEGORY
    # =====================================================

    new_ticket_category = None

    if "ticket_category_id" in data:

        ticket_category_id = data.get(
            "ticket_category_id"
        )

        if not ticket_category_id:

            return jsonify({
                "status": "error",
                "message": (
                    "Ticket category ID "
                    "tidak boleh kosong"
                )
            }), 400

        new_ticket_category = db.session.get(
            TicketCategory,
            ticket_category_id
        )

        if not new_ticket_category:

            return jsonify({
                "status": "error",
                "message": (
                    "Ticket category "
                    "tidak ditemukan"
                )
            }), 404

        if not new_ticket_category.active:

            return jsonify({
                "status": "error",
                "message": (
                    f"Tiket "
                    f"{new_ticket_category.name} "
                    "sedang tidak aktif"
                )
            }), 400

    else:

        new_ticket_category = db.session.get(
            TicketCategory,
            order_item.ticket_category_id
        )

    # =====================================================
    # QTY
    # =====================================================

    new_qty = order_item.qty

    if "qty" in data:

        qty = data.get(
            "qty"
        )

        try:

            qty = int(qty)

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "status": "error",
                "message": (
                    "Quantity harus "
                    "berupa angka"
                )
            }), 400

        if qty <= 0:

            return jsonify({
                "status": "error",
                "message": (
                    "Quantity minimal 1"
                )
            }), 400

        new_qty = qty

    # =====================================================
    # CEK CATEGORY
    # =====================================================

    if not new_ticket_category:

        return jsonify({
            "status": "error",
            "message": (
                "Ticket category "
                "tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CEK STOCK
    # =====================================================

    available_stock = (
        new_ticket_category.stock
        - new_ticket_category.sold
    )

    if new_qty > available_stock:

        return jsonify({
            "status": "error",
            "message": (
                f"Stok "
                f"{new_ticket_category.name} "
                "tidak mencukupi"
            ),
            "available_stock": available_stock
        }), 400

    # =====================================================
    # UPDATE
    # =====================================================

    order_item.ticket_category_id = (
        new_ticket_category.id
    )

    # SNAPSHOT HARGA TERBARU
    order_item.price = (
        new_ticket_category.price
    )

    order_item.qty = new_qty

    # =====================================================
    # FLUSH
    # =====================================================

    db.session.flush()

    # =====================================================
    # HITUNG ULANG ORDER
    # =====================================================

    try:

        totals = recalculate_order_total(
            order
        )

    except ValueError as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
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
            "message": (
                "Gagal mengupdate "
                "order item"
            ),
            "error": str(e)
        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Order item berhasil diupdate"
        ),

        "data": {

            "order_item":
                order_item.to_dict(),

            "order": {
                "id": order.id,
                "subtotal": float(
                    totals["subtotal"]
                ),
                "discount_amount": float(
                    totals["discount_amount"]
                ),
                "total": float(
                    totals["total"]
                )
            }
        }

    }), 200


# =========================================================
# DELETE ORDER ITEM
# =========================================================

@jwt_required()
def delete_order_item(id):

    user_id = get_current_user_id()

    order_item = db.session.get(
        OrderItem,
        id
    )

    if not order_item:

        return jsonify({
            "status": "error",
            "message": (
                "Order item tidak ditemukan"
            )
        }), 404

    # =====================================================
    # CEK ORDER
    # =====================================================

    order = order_item.order

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
            "message": (
                "Anda tidak memiliki "
                "order item ini"
            )
        }), 403

    # =====================================================
    # ORDER HARUS PENDING
    # =====================================================

    if order.status != "pending":

        return jsonify({
            "status": "error",
            "message": (
                "Order item tidak dapat dihapus"
            ),
            "order_status": order.status
        }), 400

    # =====================================================
    # DELETE
    # =====================================================

    db.session.delete(
        order_item
    )

    # =====================================================
    # FLUSH
    # =====================================================

    db.session.flush()

    # =====================================================
    # HITUNG ULANG ORDER
    # =====================================================

    try:

        totals = recalculate_order_total(
            order
        )

    except ValueError as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
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
            "message": (
                "Gagal menghapus "
                "order item"
            ),
            "error": str(e)
        }), 500

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Order item berhasil dihapus"
        ),

        "data": {

            "order": {
                "id": order.id,
                "subtotal": float(
                    totals["subtotal"]
                ),
                "discount_amount": float(
                    totals["discount_amount"]
                ),
                "total": float(
                    totals["total"]
                )
            }
        }

    }), 200