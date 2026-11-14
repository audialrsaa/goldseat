from app.extensions import db


class Setting(db.Model):
    __tablename__ = "settings"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # KEY
    # =========================================================
    # Contoh:
    # admin_fee
    # cs_contact
    # seat_lock_minutes

    key = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    # =========================================================
    # VALUE
    # =========================================================
    # Nilai disimpan sebagai TEXT.
    # Cara membacanya mengikuti kolom type.

    value = db.Column(
        db.Text,
        nullable=False
    )

    # =========================================================
    # TYPE
    # =========================================================

    type = db.Column(
        db.String(20),
        nullable=False,
        default="string"
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
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "key": self.key,

            "value": self.value,

            "type": self.type,

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