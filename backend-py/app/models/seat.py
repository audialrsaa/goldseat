from app.extensions import db


class Seat(db.Model):
    __tablename__ = "seats"

    __table_args__ = (
        db.Index("idx_seats_locked_by", "locked_by"),
        db.Index("idx_seats_ticket_category_id", "ticket_category_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # TICKET CATEGORY
    # =========================================================

    ticket_category_id = db.Column(
        db.BigInteger,
        db.ForeignKey("ticket_categories.id"),
        nullable=False
    )

    # =========================================================
    # SEAT CODE
    # =========================================================

    seat_code = db.Column(
        db.String(20),
        nullable=False
    )

    # =========================================================
    # STATUS
    # =========================================================
    #
    # available = bisa dipilih
    # locked    = sedang dipilih user
    # booked    = sudah berhasil dibeli
    #
    # locked akan dilepas kembali jika waktu lock habis.
    # =========================================================

    status = db.Column(
        db.String(20),
        nullable=False,
        default="available"
    )

    # =========================================================
    # LOCK INFORMATION
    # =========================================================

    locked_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=True
    )

    locked_at = db.Column(
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
    # RELATIONSHIP - TICKET CATEGORY
    # =========================================================

    ticket_category = db.relationship(
        "TicketCategory",
        backref=db.backref(
            "seats",
            lazy=True,
            cascade="all, delete"
        )
    )

    # =========================================================
    # RELATIONSHIP - LOCKED USER
    # =========================================================

    locked_user = db.relationship(
        "User",
        foreign_keys=[locked_by],
        backref=db.backref(
            "locked_seats",
            lazy=True
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "ticket_category_id": (
                self.ticket_category_id
            ),

            "seat_code": self.seat_code,

            "status": self.status,

            "locked_by": self.locked_by,

            "locked_at": (
                self.locked_at.isoformat()
                if self.locked_at
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