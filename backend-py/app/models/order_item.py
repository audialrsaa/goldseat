from app.extensions import db


class OrderItem(db.Model):
    __tablename__ = "order_items"

    __table_args__ = (
        db.Index("idx_order_items_order_id", "order_id"),
        db.Index("idx_order_items_ticket_category_id", "ticket_category_id"),
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
    # TICKET CATEGORY
    # =========================================================

    ticket_category_id = db.Column(
        db.BigInteger,
        db.ForeignKey("ticket_categories.id"),
        nullable=False
    )

    # =========================================================
    # QUANTITY
    # =========================================================

    qty = db.Column(
        db.Integer,
        nullable=False
    )

    # =========================================================
    # PRICE SNAPSHOT
    # =========================================================
    # Harga tiket saat order dibuat.
    # Tidak mengikuti perubahan harga di ticket_categories.

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # =========================================================
    # RELATIONSHIP - ORDER
    # =========================================================

    order = db.relationship(
        "Order",
        backref=db.backref(
            "items",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    # =========================================================
    # RELATIONSHIP - TICKET CATEGORY
    # =========================================================

    ticket_category = db.relationship(
        "TicketCategory",
        backref=db.backref(
            "order_items",
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

            "ticket_category_id": self.ticket_category_id,

            "qty": self.qty,

            "price": (
                float(self.price)
                if self.price is not None
                else 0
            ),

            "subtotal": (
                float(self.price * self.qty)
                if self.price is not None
                else 0
            )
        }