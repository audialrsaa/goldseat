from app.extensions import db


class Voucher(db.Model):
    __tablename__ = "vouchers"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id"),
        nullable=True
    )

    code = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    type = db.Column(
        db.Enum(
            "percentage",
            "fixed"
        ),
        nullable=False
    )

    discount = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    min_transaction = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0
    )

    max_discount = db.Column(
        db.Numeric(12, 2),
        nullable=True
    )

    quota = db.Column(
        db.Integer,
        nullable=False
    )

    start_date = db.Column(
        db.Date,
        nullable=False
    )

    end_date = db.Column(
        db.Date,
        nullable=False
    )

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

    event = db.relationship(
        "Event",
        backref="vouchers"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "code": self.code,
            "type": self.type,
            "discount": float(self.discount)
            if self.discount is not None
            else 0,
            "min_transaction": float(self.min_transaction)
            if self.min_transaction is not None
            else 0,
            "max_discount": float(self.max_discount)
            if self.max_discount is not None
            else None,
            "quota": self.quota,
            "start_date": (
                self.start_date.isoformat()
                if self.start_date
                else None
            ),
            "end_date": (
                self.end_date.isoformat()
                if self.end_date
                else None
            ),
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }