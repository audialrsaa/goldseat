from app.extensions import db


class TicketCategory(db.Model):
    __tablename__ = "ticket_categories"

    __table_args__ = (
        db.Index("idx_ticket_categories_event_id", "event_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # EVENT
    # =========================================================

    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id"),
        nullable=False
    )

    # =========================================================
    # CATEGORY
    # =========================================================

    name = db.Column(
        db.String(100),
        nullable=False
    )

    # =========================================================
    # PRICE
    # =========================================================

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # =========================================================
    # STOCK
    # =========================================================

    stock = db.Column(
        db.Integer,
        nullable=False
    )

    # =========================================================
    # SOLD
    # =========================================================
    # Jumlah tiket yang sudah benar-benar terjual.

    sold = db.Column(
        db.Integer,
        nullable=False,
        default=0,
        server_default="0"
    )

    # =========================================================
    # ACTIVE
    # =========================================================

    active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.text("true")
    )

    # =========================================================
    # SALE PERIOD
    # =========================================================

    sale_start_at = db.Column(
        db.DateTime,
        nullable=True
    )

    sale_end_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # =========================================================
    # MAX QTY PER USER
    # =========================================================
    # Batas jumlah tiket kategori ini yang dapat dibeli
    # oleh satu user.
    #
    # NULL = tidak ada batas khusus.

    max_qty_per_user = db.Column(
        db.Integer,
        nullable=True
    )

    # =========================================================
    # RELATIONSHIP
    # =========================================================

    event = db.relationship(
        "Event",
        backref=db.backref(
            "ticket_categories",
            lazy=True,
            cascade="all, delete"
        )
    )

    # =========================================================
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "event_id": self.event_id,

            "name": self.name,

            "price": (
                float(self.price)
                if self.price is not None
                else 0
            ),

            "stock": self.stock,

            "sold": self.sold,

            "active": self.active,

            "sale_start_at": (
                self.sale_start_at.isoformat()
                if self.sale_start_at
                else None
            ),

            "sale_end_at": (
                self.sale_end_at.isoformat()
                if self.sale_end_at
                else None
            ),

            "max_qty_per_user": self.max_qty_per_user
        }