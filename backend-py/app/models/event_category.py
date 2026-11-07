from app.extensions import db


class EventCategory(db.Model):

    __tablename__ = "event_categories"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    slug = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    icon = db.Column(
        db.String(255),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    # Relationship ke Event ditangani
    # oleh Event.category dengan backref="events"

    def to_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "icon": self.icon,
            "is_active": self.is_active
        }