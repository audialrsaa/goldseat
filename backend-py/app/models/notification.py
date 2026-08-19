from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

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
    # TYPE
    # =========================================================

    type = db.Column(
        db.Enum(
            "order_update",
            "promo",
            "system",
            "refund",
            "waitlist"
        ),
        nullable=False
    )

    # =========================================================
    # TITLE
    # =========================================================

    title = db.Column(
        db.String(150),
        nullable=False
    )

    # =========================================================
    # MESSAGE
    # =========================================================

    message = db.Column(
        db.Text,
        nullable=False
    )

    # =========================================================
    # DATA
    # =========================================================
    # Payload tambahan untuk kebutuhan deep-link
    # atau informasi tambahan notifikasi.

    data = db.Column(
        db.JSON,
        nullable=True
    )

    # =========================================================
    # READ STATUS
    # =========================================================

    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default="0"
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

    user = db.relationship(
        "User",
        backref=db.backref(
            "notifications",
            lazy=True
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "user_id": self.user_id,

            "type": self.type,

            "title": self.title,

            "message": self.message,

            "data": self.data,

            "is_read": self.is_read,

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