from app.extensions import db


class Refund(db.Model):
    __tablename__ = "refunds"

    __table_args__ = (
        db.Index("idx_refunds_order_id", "order_id"),
        db.Index("idx_refunds_processed_by", "processed_by"),
        db.Index("idx_refunds_requested_by", "requested_by"),
    )

    # ==========================
    # PRIMARY KEY
    # ==========================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # ==========================
    # ORDER
    # ==========================

    order_id = db.Column(
        db.BigInteger,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    # ==========================
    # REQUESTED BY
    # ==========================

    requested_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # ==========================
    # REASON
    # ==========================

    reason = db.Column(
        db.Text,
        nullable=False
    )

    # ==========================
    # AMOUNT
    # ==========================

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # ==========================
    # STATUS
    # ==========================

    status = db.Column(
        db.String(20),
        nullable=False,
        default="requested"
    )

    # ==========================
    # PROCESSED BY
    # ==========================

    processed_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=True
    )

    # ==========================
    # PROCESSED AT
    # ==========================

    processed_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # ==========================
    # REFUND METHOD
    # ==========================

    refund_method = db.Column(
        db.String(30),
        nullable=False,
        default="original_payment"
    )

    # ==========================
    # TIMESTAMP
    # ==========================

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    # ==========================
    # RELATIONSHIP
    # ==========================

    order = db.relationship(
        "Order",
        backref="refunds"
    )

    requester = db.relationship(
        "User",
        foreign_keys=[requested_by],
        backref="refund_requests"
    )

    processor = db.relationship(
        "User",
        foreign_keys=[processed_by],
        backref="processed_refunds"
    )

    # ==========================
    # TO DICT
    # ==========================

    def to_dict(self):

        return {
            "id": self.id,

            "order_id": self.order_id,

            "requested_by": self.requested_by,

            "reason": self.reason,

            "amount": (
                float(self.amount)
                if self.amount is not None
                else 0
            ),

            "status": self.status,

            "processed_by": self.processed_by,

            "processed_at": (
                self.processed_at.isoformat()
                if self.processed_at
                else None
            ),

            "refund_method": self.refund_method,

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