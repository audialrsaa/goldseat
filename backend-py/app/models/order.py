from app.extensions import db


class Order(db.Model):
    __tablename__ = "orders"

    __table_args__ = (
        db.Index("idx_orders_user_id", "user_id"),
        db.Index("idx_orders_voucher_id", "voucher_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # USER
    # =========================================================

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # =========================================================
    # ORDER NUMBER
    # =========================================================

    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    # =========================================================
    # TOTAL
    # =========================================================

    total = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # =========================================================
    # VOUCHER
    # =========================================================

    voucher_id = db.Column(
        db.BigInteger,
        db.ForeignKey("vouchers.id"),
        nullable=True
    )

    discount_amount = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0,
        server_default="0"
    )

    # =========================================================
    # PAYMENT EXPIRATION
    # =========================================================

    expired_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # =========================================================
    # CHANNEL
    # =========================================================

    channel = db.Column(
        db.String(20),
        nullable=False,
        default="online"
    )

    # =========================================================
    # IDEMPOTENCY
    # =========================================================

    idempotency_key = db.Column(
        db.String(100),
        unique=True,
        nullable=True
    )

    # =========================================================
    # NOTES
    # =========================================================

    notes = db.Column(
        db.Text,
        nullable=True
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
    # RELATIONSHIP - USER
    # =========================================================

    user = db.relationship(
        "User",
        backref=db.backref(
            "orders",
            lazy=True
        )
    )

    # =========================================================
    # RELATIONSHIP - VOUCHER
    # =========================================================

    voucher = db.relationship(
        "Voucher",
        backref=db.backref(
            "orders",
            lazy=True
        )
    )

    # =========================================================
    # ORDER ITEMS
    # =========================================================
    #
    # OrderItem menggunakan:
    #
    # order = db.relationship(
    #     "Order",
    #     backref=db.backref(
    #         "items",
    #         lazy=True,
    #         cascade="all, delete-orphan"
    #     )
    # )
    #
    # Jadi order.items otomatis tersedia.
    #
    # Tidak perlu relationship kedua di sini karena
    # bisa menyebabkan relationship/backref bentrok.

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "user_id": self.user_id,

            "order_number": self.order_number,

            "status": self.status,

            "total": (
                float(self.total)
                if self.total is not None
                else 0
            ),

            "voucher_id": self.voucher_id,

            "discount_amount": (
                float(self.discount_amount)
                if self.discount_amount is not None
                else 0
            ),

            "expired_at": (
                self.expired_at.isoformat()
                if self.expired_at
                else None
            ),

            "channel": self.channel,

            "idempotency_key": self.idempotency_key,

            "notes": self.notes,

            # =============================================
            # ORDER ITEMS
            # =============================================

            "items": [
                item.to_dict()
                for item in self.items
            ],

            # =============================================
            # TIMESTAMP
            # =============================================

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