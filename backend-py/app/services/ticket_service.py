import secrets

from app.extensions import db
from app.models.ticket import Ticket


# =========================================================
# GENERATE TICKET NUMBER
# =========================================================

def generate_ticket_number():

    while True:

        ticket_number = (
            "TKT-"
            + secrets.token_hex(4).upper()
        )

        existing_ticket = Ticket.query.filter_by(
            ticket_number=ticket_number
        ).first()

        if not existing_ticket:
            return ticket_number


# =========================================================
# GENERATE QR TOKEN
# =========================================================

def generate_qr_token():

    # Token random.
    # Tidak menggunakan ticket_id secara langsung.

    return secrets.token_urlsafe(32)


# =========================================================
# CREATE ONE TICKET
# =========================================================

def create_ticket_from_order_item(
    order_item,
    owner_name=None,
    seat_id=None
):

    ticket = Ticket(

        order_item_id=order_item.id,

        seat_id=seat_id,

        ticket_number=generate_ticket_number(),

        qr_code=generate_qr_token(),

        owner_name=owner_name,

        status="issued"
    )

    db.session.add(ticket)

    return ticket


# =========================================================
# GENERATE TICKETS FROM ORDER
# =========================================================

def generate_tickets_for_order(
    order,
    owner_name=None
):

    tickets = []

    # =====================================================
    # VALIDASI ORDER
    # =====================================================

    if not order:

        raise ValueError(
            "Order tidak ditemukan"
        )

    # =====================================================
    # VALIDASI ORDER ITEMS
    # =====================================================

    if not order.items:

        raise ValueError(
            "Order tidak memiliki order item"
        )

    # =====================================================
    # GENERATE TICKET
    # =====================================================

    for order_item in order.items:

        # -------------------------------------------------
        # VALIDASI QTY
        # -------------------------------------------------

        if not order_item.qty or order_item.qty <= 0:

            raise ValueError(
                "Quantity order item tidak valid"
            )

        # -------------------------------------------------
        # BUAT TICKET SESUAI QTY
        # -------------------------------------------------

        for _ in range(
            order_item.qty
        ):

            ticket = create_ticket_from_order_item(

                order_item=order_item,

                owner_name=owner_name,

                seat_id=None
            )

            tickets.append(
                ticket
            )

    return tickets