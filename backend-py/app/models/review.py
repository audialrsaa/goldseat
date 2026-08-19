from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

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
    # EVENT
    # =========================================================

    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id"),
        nullable=False
    )

    # =========================================================
    # RATING
    # =========================================================

    rating = db.Column(
        db.Integer,
        nullable=False
    )

    # =========================================================
    # REVIEW
    # =========================================================

    review = db.Column(
        db.Text,
        nullable=False
    )

    # =========================================================
    # PHOTO
    # =========================================================

    photo = db.Column(
        db.String(255),
        nullable=True
    )

    # =========================================================
    # VERIFIED PURCHASE
    # =========================================================
    # True jika user sudah check-in pada event tersebut.

    is_verified_purchase = db.Column(
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
            "reviews",
            lazy=True
        )
    )

    event = db.relationship(
        "Event",
        backref=db.backref(
            "reviews",
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

            "event_id": self.event_id,

            "rating": self.rating,

            "review": self.review,

            "photo": self.photo,

            "is_verified_purchase": self.is_verified_purchase,

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