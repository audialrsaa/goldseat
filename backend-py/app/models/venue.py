from app.extensions import db


class Venue(db.Model):
    __tablename__ = "venues"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    address = db.Column(
        db.Text,
        nullable=True
    )

    city = db.Column(
        db.String(100),
        nullable=True
    )

    photo = db.Column(
        db.String(255),
        nullable=True
    )

    maps_url = db.Column(
        db.Text,
        nullable=True
    )

    latitude = db.Column(
        db.Numeric(10, 7),
        nullable=True
    )

    longitude = db.Column(
        db.Numeric(10, 7),
        nullable=True
    )

    capacity = db.Column(
        db.Integer,
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

    events = db.relationship(
        "Event",
        backref="venue",
        lazy=True,
        cascade="all, delete"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "photo": self.photo,
            "maps_url": self.maps_url,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "capacity": self.capacity,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }