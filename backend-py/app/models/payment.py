from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class Payment(db.Model):
    __tablename__ = "payments"

    __table_args__ = (
        db.Index("idx_payments_order_id", "order_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # ORDER
    # =========================================================

    order_id = db.Column(
        db.BigInteger,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    # =========================================================
    # PAYMENT PROVIDER
    # =========================================================

    provider = db.Column(
        db.String(50),
        nullable=False
    )

    # Contoh:
    # midtrans
    # xendit
    # cash

    # =========================================================
    # STATUS
    # =========================================================

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    # =========================================================
    # TRANSACTION
    # =========================================================

    transaction_id = db.Column(
        db.String(100),
        nullable=True
    )

    # =========================================================
    # AMOUNT
    # =========================================================

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # =========================================================
    # PAYMENT METHOD
    # =========================================================

    payment_method = db.Column(
        db.String(20),
        nullable=True
    )

    # =========================================================
    # PAID AT
    # =========================================================

    paid_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # =========================================================
    # RAW RESPONSE
    # =========================================================
    # Menyimpan response asli dari payment gateway
    # untuk kebutuhan audit/debugging.

    raw_response = db.Column(JSONB, nullable=True)

    # =========================================================
    # IDEMPOTENCY KEY
    # =========================================================
    # Mencegah pembuatan payment ganda
    # akibat request yang dikirim ulang.

    idempotency_key = db.Column(
        db.String(100),
        unique=True,
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
    # RELATIONSHIP
    # =========================================================

    order = db.relationship(
        "Order",
        backref=db.backref(
            "payments",
            lazy=True
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "order_id": self.order_id,

            "provider": self.provider,

            "status": self.status,

            "transaction_id": self.transaction_id,

            "amount": (
                float(self.amount)
                if self.amount is not None
                else 0
            ),

            "payment_method": self.payment_method,

            "paid_at": (
                self.paid_at.isoformat()
                if self.paid_at
                else None
            ),

            "raw_response": self.raw_response,

            "idempotency_key": self.idempotency_key,

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