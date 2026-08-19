from app.extensions import db


class Checkin(db.Model):
    __tablename__ = "checkins"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # TICKET
    # =========================================================

    ticket_id = db.Column(
        db.BigInteger,
        db.ForeignKey("tickets.id"),
        nullable=False
    )

    # =========================================================
    # STAFF YANG MELAKUKAN CHECK-IN
    # =========================================================

    checked_in_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # =========================================================
    # GATE
    # =========================================================
    # Nama pintu masuk.
    # Contoh: Gate A, Gate VIP, Gate 1.
    # Nullable karena tidak semua event punya banyak gate.

    gate = db.Column(
        db.String(50),
        nullable=True
    )

    # =========================================================
    # DEVICE
    # =========================================================
    # Identitas device yang digunakan staff
    # untuk melakukan scan.

    device_id = db.Column(
        db.String(100),
        nullable=True
    )

    # =========================================================
    # CHECKED IN AT
    # =========================================================

    checked_in_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
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

    ticket = db.relationship(
        "Ticket",
        backref=db.backref(
            "checkins",
            lazy=True
        )
    )

    checked_in_user = db.relationship(
        "User",
        foreign_keys=[checked_in_by],
        backref=db.backref(
            "checkins_performed",
            lazy=True
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "ticket_id": self.ticket_id,

            "checked_in_by": self.checked_in_by,

            "gate": self.gate,

            "device_id": self.device_id,

            "checked_in_at": (
                self.checked_in_at.isoformat()
                if self.checked_in_at
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