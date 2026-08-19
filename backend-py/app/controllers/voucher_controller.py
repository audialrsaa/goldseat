from flask import request, jsonify
from datetime import date

from app.extensions import db
from app.models.voucher import Voucher
from app.models.event import Event


# ==========================
# CREATE
# ==========================

def create_voucher():

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Data wajib diisi"
        }), 400

    event_id = data.get("event_id")
    code = data.get("code")
    voucher_type = data.get("type")
    discount = data.get("discount")
    min_transaction = data.get("min_transaction", 0)
    max_discount = data.get("max_discount")
    quota = data.get("quota")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    # ==========================
    # VALIDASI FIELD WAJIB
    # ==========================

    if not all([
        code,
        voucher_type,
        discount is not None,
        quota is not None,
        start_date,
        end_date
    ]):
        return jsonify({
            "status": "error",
            "message": "Code, type, discount, quota, start_date, dan end_date wajib diisi"
        }), 400

    # ==========================
    # VALIDASI TYPE
    # ==========================

    if voucher_type not in ["percentage", "fixed"]:
        return jsonify({
            "status": "error",
            "message": "Type harus percentage atau fixed"
        }), 400

    # ==========================
    # CEK EVENT
    # ==========================

    if event_id is not None:

        event = db.session.get(Event, event_id)

        if not event:
            return jsonify({
                "status": "error",
                "message": "Event tidak ditemukan"
            }), 404

    # ==========================
    # CEK CODE
    # ==========================

    existing_voucher = Voucher.query.filter_by(
        code=code
    ).first()

    if existing_voucher:
        return jsonify({
            "status": "error",
            "message": "Code voucher sudah digunakan"
        }), 409

    # ==========================
    # VALIDASI DISCOUNT
    # ==========================

    if float(discount) <= 0:
        return jsonify({
            "status": "error",
            "message": "Discount harus lebih dari 0"
        }), 400

    if voucher_type == "percentage":

        if float(discount) > 100:
            return jsonify({
                "status": "error",
                "message": "Discount percentage tidak boleh lebih dari 100"
            }), 400

    # max_discount hanya digunakan percentage
    if voucher_type == "fixed":
        max_discount = None

    # ==========================
    # VALIDASI QUOTA
    # ==========================

    if int(quota) < 1:
        return jsonify({
            "status": "error",
            "message": "Quota minimal 1"
        }), 400

    # ==========================
    # VALIDASI TANGGAL
    # ==========================

    try:

        parsed_start_date = date.fromisoformat(start_date)
        parsed_end_date = date.fromisoformat(end_date)

    except ValueError:

        return jsonify({
            "status": "error",
            "message": "Format tanggal harus YYYY-MM-DD"
        }), 400

    if parsed_end_date < parsed_start_date:

        return jsonify({
            "status": "error",
            "message": "End date tidak boleh sebelum start date"
        }), 400

    # ==========================
    # CREATE
    # ==========================

    voucher = Voucher(
        event_id=event_id,
        code=code,
        type=voucher_type,
        discount=discount,
        min_transaction=min_transaction,
        max_discount=max_discount,
        quota=quota,
        start_date=parsed_start_date,
        end_date=parsed_end_date
    )

    db.session.add(voucher)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Voucher berhasil ditambahkan",
        "data": voucher.to_dict()
    }), 201


# ==========================
# GET ALL
# ==========================

def get_vouchers():

    vouchers = Voucher.query.order_by(
        Voucher.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            voucher.to_dict()
            for voucher in vouchers
        ]
    }), 200


# ==========================
# GET DETAIL
# ==========================

def get_voucher(id):

    voucher = db.session.get(
        Voucher,
        id
    )

    if not voucher:

        return jsonify({
            "status": "error",
            "message": "Voucher tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": voucher.to_dict()
    }), 200


# ==========================
# UPDATE
# ==========================

def update_voucher(id):

    voucher = db.session.get(
        Voucher,
        id
    )

    if not voucher:

        return jsonify({
            "status": "error",
            "message": "Voucher tidak ditemukan"
        }), 404

    data = request.get_json()

    if not data:

        return jsonify({
            "status": "error",
            "message": "Data wajib diisi"
        }), 400

    # ==========================
    # EVENT
    # ==========================

    if "event_id" in data:

        event_id = data.get("event_id")

        if event_id is not None:

            event = db.session.get(
                Event,
                event_id
            )

            if not event:

                return jsonify({
                    "status": "error",
                    "message": "Event tidak ditemukan"
                }), 404

        voucher.event_id = event_id

    # ==========================
    # CODE
    # ==========================

    if "code" in data:

        code = data.get("code")

        existing_voucher = Voucher.query.filter(
            Voucher.code == code,
            Voucher.id != id
        ).first()

        if existing_voucher:

            return jsonify({
                "status": "error",
                "message": "Code voucher sudah digunakan"
            }), 409

        voucher.code = code

    # ==========================
    # TYPE
    # ==========================

    if "type" in data:

        voucher_type = data.get("type")

        if voucher_type not in [
            "percentage",
            "fixed"
        ]:

            return jsonify({
                "status": "error",
                "message": "Type harus percentage atau fixed"
            }), 400

        voucher.type = voucher_type

    # ==========================
    # DISCOUNT
    # ==========================

    if "discount" in data:

        discount = data.get("discount")

        if float(discount) <= 0:

            return jsonify({
                "status": "error",
                "message": "Discount harus lebih dari 0"
            }), 400

        voucher.discount = discount

    # ==========================
    # VALIDASI PERCENTAGE
    # ==========================

    if voucher.type == "percentage":

        if float(voucher.discount) > 100:

            return jsonify({
                "status": "error",
                "message": "Discount percentage tidak boleh lebih dari 100"
            }), 400

    # Kalau fixed, max discount tidak diperlukan
    if voucher.type == "fixed":

        voucher.max_discount = None

    # ==========================
    # MIN TRANSACTION
    # ==========================

    if "min_transaction" in data:

        min_transaction = data.get(
            "min_transaction"
        )

        if float(min_transaction) < 0:

            return jsonify({
                "status": "error",
                "message": "Minimum transaction tidak boleh negatif"
            }), 400

        voucher.min_transaction = min_transaction

    # ==========================
    # MAX DISCOUNT
    # ==========================

    if "max_discount" in data:

        if voucher.type == "percentage":

            voucher.max_discount = data.get(
                "max_discount"
            )

    # ==========================
    # QUOTA
    # ==========================

    if "quota" in data:

        quota = data.get("quota")

        if int(quota) < 1:

            return jsonify({
                "status": "error",
                "message": "Quota minimal 1"
            }), 400

        voucher.quota = quota

    # ==========================
    # START DATE
    # ==========================

    if "start_date" in data:

        try:

            voucher.start_date = date.fromisoformat(
                data.get("start_date")
            )

        except ValueError:

            return jsonify({
                "status": "error",
                "message": "Format start_date harus YYYY-MM-DD"
            }), 400

    # ==========================
    # END DATE
    # ==========================

    if "end_date" in data:

        try:

            voucher.end_date = date.fromisoformat(
                data.get("end_date")
            )

        except ValueError:

            return jsonify({
                "status": "error",
                "message": "Format end_date harus YYYY-MM-DD"
            }), 400

    # ==========================
    # VALIDASI RANGE DATE
    # ==========================

    if voucher.end_date < voucher.start_date:

        return jsonify({
            "status": "error",
            "message": "End date tidak boleh sebelum start date"
        }), 400

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Voucher berhasil diupdate",
        "data": voucher.to_dict()
    }), 200


# ==========================
# DELETE
# ==========================

def delete_voucher(id):

    voucher = db.session.get(
        Voucher,
        id
    )

    if not voucher:

        return jsonify({
            "status": "error",
            "message": "Voucher tidak ditemukan"
        }), 404

    db.session.delete(voucher)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Voucher berhasil dihapus"
    }), 200