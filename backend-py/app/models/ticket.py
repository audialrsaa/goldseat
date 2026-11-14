from app.extensions import db


class Ticket(db.Model):
    __tablename__ = "tickets"

    __table_args__ = (
        db.Index("idx_tickets_order_item_id", "order_item_id"),
        db.Index("idx_tickets_owner_user_id", "owner_user_id"),
        db.Index("idx_tickets_seat_id", "seat_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # ORDER ITEM
    # =========================================================

    order_item_id = db.Column(
        db.BigInteger,
        db.ForeignKey("order_items.id"),
        nullable=False
    )

    # =========================================================
    # SEAT
    # =========================================================
    # NULL untuk event tanpa kursi.

    seat_id = db.Column(
        db.BigInteger,
        db.ForeignKey("seats.id"),
        nullable=True
    )

    # =========================================================
    # CURRENT OWNER
    # =========================================================

    owner_user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=True
    )

    # =========================================================
    # TICKET NUMBER
    # =========================================================

    ticket_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # =========================================================
    # QR CODE / TOKEN
    # =========================================================

    qr_code = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    # =========================================================
    # OWNER NAME
    # =========================================================

    owner_name = db.Column(
        db.String(150),
        nullable=True
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = db.Column(
        db.String(20),
        nullable=False,
        default="issued"
    )

    # =========================================================
    # TIMESTAMP
    # =========================================================

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    # =========================================================
    # RELATIONSHIP - ORDER ITEM
    # =========================================================

    order_item = db.relationship(
        "OrderItem",
        backref=db.backref(
            "tickets",
            lazy=True
        )
    )

    # =========================================================
    # RELATIONSHIP - SEAT
    # =========================================================

    seat = db.relationship(
        "Seat",
        backref=db.backref(
            "ticket",
            uselist=False
        ),
        foreign_keys=[seat_id]
    )

    # =========================================================
    # RELATIONSHIP - OWNER
    # =========================================================

    owner_user = db.relationship(
        "User",
        foreign_keys=[owner_user_id],
        backref=db.backref(
            "owned_tickets",
            lazy=True
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "order_item_id": self.order_item_id,

            "seat_id": self.seat_id,

            "owner_user_id": self.owner_user_id,

            "ticket_number": self.ticket_number,

            "qr_code": self.qr_code,

            "owner_name": self.owner_name,

            "status": self.status,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),

            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }