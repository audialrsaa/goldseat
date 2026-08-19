from app.extensions import db


class Banner(db.Model):
    __tablename__ = "banners"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # IMAGE
    # =========================================================

    image = db.Column(
        db.String(255),
        nullable=False
    )

    # =========================================================
    # TITLE
    # =========================================================

    title = db.Column(
        db.String(150),
        nullable=True
    )

    # =========================================================
    # LINK
    # =========================================================

    link_url = db.Column(
        db.String(255),
        nullable=True
    )

    # =========================================================
    # SORT ORDER
    # =========================================================

    sort_order = db.Column(
        db.Integer,
        nullable=False,
        default=0,
        server_default="0"
    )

    # =========================================================
    # ACTIVE
    # =========================================================

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default="1"
    )

    # =========================================================
    # SCHEDULE
    # =========================================================

    start_at = db.Column(
        db.DateTime,
        nullable=True
    )

    end_at = db.Column(
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
    # TO DICT
    # =========================================================

    def to_dict(self):

        return {
            "id": self.id,

            "image": self.image,

            "title": self.title,

            "link_url": self.link_url,

            "sort_order": self.sort_order,

            "is_active": self.is_active,

            "start_at": (
                self.start_at.isoformat()
                if self.start_at
                else None
            ),

            "end_at": (
                self.end_at.isoformat()
                if self.end_at
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