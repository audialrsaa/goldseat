from datetime import datetime, timedelta

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func

from app.extensions import db

from app.models.event import Event
from app.models.order import Order
from app.models.ticket import Ticket
from app.models.refund import Refund


# =========================================================
# HELPER
# =========================================================

def _require_super_admin():
    """
    dashboard cuma boleh diakses super_admin.
    """

    claims = get_jwt()

    return claims.get("role") == "super_admin"


# =========================================================
# GET DASHBOARD STATS
# =========================================================
# endpoint: GET /api/admin/dashboard
#
# catatan:
# - controller order/ticket yang sudah ada di-scope per user,
#   jadi dashboard ini query langsung ke model, bukan lewat
#   fungsi controller lain.
# - kalau nanti butuh filter tanggal custom, tinggal terima
#   query param ?days=30 dan pakai itu buat range-nya.
# =========================================================

@jwt_required()
def get_dashboard_stats():

    if not _require_super_admin():

        return jsonify({
            "status": "error",
            "message": "Hanya super admin yang dapat mengakses dashboard ini"
        }), 403

    now = datetime.utcnow()

    last_30 = now - timedelta(days=30)
    prev_30 = now - timedelta(days=60)


    # =====================================================
    # TOTAL REVENUE (30 hari terakhir vs 30 hari sebelumnya)
    # =====================================================

    current_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(
        Order.status == "paid",
        Order.created_at >= last_30
    ).scalar()

    previous_revenue = db.session.query(
        func.coalesce(func.sum(Order.total), 0)
    ).filter(
        Order.status == "paid",
        Order.created_at >= prev_30,
        Order.created_at < last_30
    ).scalar()

    if previous_revenue and previous_revenue > 0:
        revenue_growth = round(
            ((current_revenue - previous_revenue) / previous_revenue) * 100,
            1
        )
    else:
        revenue_growth = 0


    # =====================================================
    # EVENT AKTIF
    # =====================================================

    event_aktif = Event.query.filter_by(
        publish_status="published"
    ).count()

    event_baru_30_hari = Event.query.filter(
        Event.created_at >= last_30
    ).count()


    # =====================================================
    # TIKET TERJUAL
    # =====================================================

    tiket_terjual = Ticket.query.filter(
        Ticket.status.in_(["issued", "used"])
    ).count()

    tiket_30_hari = Ticket.query.filter(
        Ticket.status.in_(["issued", "used"]),
        Ticket.created_at >= last_30
    ).count()

    tiket_prev_30 = Ticket.query.filter(
        Ticket.status.in_(["issued", "used"]),
        Ticket.created_at >= prev_30,
        Ticket.created_at < last_30
    ).count()

    if tiket_prev_30 > 0:
        tiket_growth = round(
            ((tiket_30_hari - tiket_prev_30) / tiket_prev_30) * 100,
            1
        )
    else:
        tiket_growth = 0


    # =====================================================
    # REFUND DIPROSES
    # =====================================================

    refund_diproses = db.session.query(
        func.coalesce(func.sum(Refund.amount), 0)
    ).filter(
        Refund.status == "processed",
        Refund.processed_at >= last_30
    ).scalar()

    refund_prev = db.session.query(
        func.coalesce(func.sum(Refund.amount), 0)
    ).filter(
        Refund.status == "processed",
        Refund.processed_at >= prev_30,
        Refund.processed_at < last_30
    ).scalar()

    if refund_prev and refund_prev > 0:
        refund_growth = round(
            ((refund_diproses - refund_prev) / refund_prev) * 100,
            1
        )
    else:
        refund_growth = 0


    # =====================================================
    # GRAFIK PENJUALAN 7 HARI TERAKHIR
    # =====================================================

    grafik = []

    for i in range(6, -1, -1):

        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        day_end = day_start + timedelta(days=1)

        total_hari = db.session.query(
            func.coalesce(func.sum(Order.total), 0)
        ).filter(
            Order.status == "paid",
            Order.created_at >= day_start,
            Order.created_at < day_end
        ).scalar()

        grafik.append({
            "label": day_start.strftime("%a"),
            "date": day_start.strftime("%Y-%m-%d"),
            "total": float(total_hari)
        })


    # =====================================================
    # AKTIVITAS TERBARU (gabungan order, event, refund)
    # =====================================================

    aktivitas = []

    recent_orders = Order.query.order_by(
        Order.created_at.desc()
    ).limit(5).all()

    for order in recent_orders:

        aktivitas.append({
            "type": "order",
            "message": f"Order #{order.order_number} {('dibayar' if order.status == 'paid' else order.status)}",
            "timestamp": order.created_at.isoformat()
        })

    recent_events = Event.query.order_by(
        Event.created_at.desc()
    ).limit(5).all()

    for event in recent_events:

        aktivitas.append({
            "type": "event",
            "message": f"Event baru \"{event.title}\" dibuat",
            "timestamp": event.created_at.isoformat() if event.created_at else None
        })

    recent_refunds = Refund.query.order_by(
        Refund.id.desc()
    ).limit(5).all()

    for refund in recent_refunds:

        label = "diajukan" if refund.status == "requested" else refund.status

        aktivitas.append({
            "type": "refund",
            "message": f"Refund #RF-{refund.id} {label}",
            "timestamp": (
                refund.processed_at.isoformat()
                if refund.processed_at
                else refund.id
            )
        })

    aktivitas = sorted(
        [a for a in aktivitas if isinstance(a["timestamp"], str)],
        key=lambda a: a["timestamp"],
        reverse=True
    )[:6]


    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({
        "status": "success",
        "data": {
            "total_revenue": {
                "value": float(current_revenue),
                "growth_percent": revenue_growth
            },
            "event_aktif": {
                "value": event_aktif,
                "new_this_period": event_baru_30_hari
            },
            "tiket_terjual": {
                "value": tiket_terjual,
                "growth_percent": tiket_growth
            },
            "refund_diproses": {
                "value": float(refund_diproses),
                "growth_percent": refund_growth
            },
            "grafik_penjualan": grafik,
            "aktivitas_terbaru": aktivitas
        }
    }), 200