from app.extensions import db


class Waitlist(db.Model):
    __tablename__ = "waitlists"

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
    # USER
    # =========================================================

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # =========================================================
    # STATUS
    # =========================================================
    #
    # waiting   = sedang menunggu
    # notified  = sudah diberi tahu ada slot
    # expired   = tidak mengambil slot tepat waktu
    # converted = berhasil mengambil slot
    #

    status = db.Column(
        db.Enum(
            "waiting",
            "notified",
            "expired",
            "converted"
        ),
        nullable=False,
        default="waiting"
    )

    # =========================================================
    # NOTIFIED AT
    # =========================================================

    notified_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # =========================================================
    # OFFER EXPIRES AT
    # =========================================================
    #
    # Batas waktu user untuk mengambil slot
    # setelah mendapatkan notifikasi.

    offer_expires_at = db.Column(
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

    ticket_category = db.relationship(
        "TicketCategory",
        backref=db.backref(
            "waitlists",
            lazy=True
        )
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "waitlists",
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

            "user_id": self.user_id,

            "status": self.status,

            "notified_at": (
                self.notified_at.isoformat()
                if self.notified_at
                else None
            ),

            "offer_expires_at": (
                self.offer_expires_at.isoformat()
                if self.offer_expires_at
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