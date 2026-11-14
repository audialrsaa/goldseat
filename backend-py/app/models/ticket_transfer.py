from app.extensions import db


class TicketTransfer(db.Model):
    __tablename__ = "ticket_transfers"

    __table_args__ = (
        db.Index("idx_ticket_transfers_from_user_id", "from_user_id"),
        db.Index("idx_ticket_transfers_ticket_id", "ticket_id"),
        db.Index("idx_ticket_transfers_to_user_id", "to_user_id"),
    )

    # ==========================
    # PRIMARY KEY
    # ==========================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # ==========================
    # TICKET
    # ==========================

    ticket_id = db.Column(
        db.BigInteger,
        db.ForeignKey("tickets.id"),
        nullable=False
    )

    # ==========================
    # FROM USER
    # ==========================

    from_user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # ==========================
    # RECEIVER EMAIL
    # ==========================

    to_email = db.Column(
        db.String(150),
        nullable=False
    )

    # ==========================
    # RECEIVER USER
    # ==========================

    to_user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=True
    )

    # ==========================
    # STATUS
    # ==========================

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    # ==========================
    # EXPIRATION
    # ==========================

    expires_at = db.Column(
        db.DateTime,
        nullable=False
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

    ticket = db.relationship(
        "Ticket",
        backref="transfers"
    )

    from_user = db.relationship(
        "User",
        foreign_keys=[from_user_id],
        backref="sent_ticket_transfers"
    )

    to_user = db.relationship(
        "User",
        foreign_keys=[to_user_id],
        backref="received_ticket_transfers"
    )

    # ==========================
    # TO DICT
    # ==========================

    def to_dict(self):

        return {
            "id": self.id,

            "ticket_id": self.ticket_id,

            "from_user_id": self.from_user_id,

            "to_email": self.to_email,

            "to_user_id": self.to_user_id,

            "status": self.status,

            "expires_at": (
                self.expires_at.isoformat()
                if self.expires_at
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