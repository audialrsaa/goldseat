from app.extensions import db


class VoucherClaim(db.Model):
    __tablename__ = "voucher_claims"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # VOUCHER
    # =========================================================

    voucher_id = db.Column(
        db.BigInteger,
        db.ForeignKey("vouchers.id"),
        nullable=False
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
    # USED AT
    # =========================================================

    used_at = db.Column(
        db.DateTime,
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

    voucher = db.relationship(
        "Voucher",
        backref=db.backref(
            "claims",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "voucher_claims",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "voucher_id": self.voucher_id,

            "user_id": self.user_id,

            "used_at": (
                self.used_at.isoformat()
                if self.used_at
                else None
            ),

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