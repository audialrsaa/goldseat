from app.extensions import db


class Artist(db.Model):
    __tablename__ = "artists"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    photo = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    # Relationship
    events = db.relationship(
        "Event",
        backref="artist",
        lazy=True,
        cascade="all, delete"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "photo": self.photo,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }