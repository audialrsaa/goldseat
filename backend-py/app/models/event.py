from app.extensions import db


class Event(db.Model):
    __tablename__ = "events"

    # ==========================
    # PRIMARY KEY
    # ==========================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # ==========================
    # FOREIGN KEYS
    # ==========================

    artist_id = db.Column(
        db.BigInteger,
        db.ForeignKey("artists.id"),
        nullable=False
    )

    venue_id = db.Column(
        db.BigInteger,
        db.ForeignKey("venues.id"),
        nullable=False
    )

    category_id = db.Column(
        db.BigInteger,
        db.ForeignKey("event_categories.id"),
        nullable=False
    )

    # ==========================
    # EVENT INFORMATION
    # ==========================

    title = db.Column(
        db.String(200),
        nullable=False
    )

    slug = db.Column(
        db.String(220),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    rules = db.Column(
        db.Text,
        nullable=True
    )

    faq = db.Column(
        db.Text,
        nullable=True
    )

    # ==========================
    # EVENT IMAGES
    # URL / PATH SUPABASE
    # ==========================

    poster = db.Column(
        db.String(255),
        nullable=True
    )

    banner = db.Column(
        db.String(255),
        nullable=True
    )

    # ==========================
    # DATE & TIME
    # ==========================

    event_date = db.Column(
        db.Date,
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=True
    )

    # ==========================
    # AGE LIMIT
    # ==========================

    min_age = db.Column(
        db.SmallInteger,
        nullable=True
    )

    # ==========================
    # TERMS & CONDITIONS
    # ==========================

    terms_url = db.Column(
        db.String(255),
        nullable=True
    )

    # ==========================
    # PUBLISH STATUS
    # ==========================

    publish_status = db.Column(
        db.Enum(
            "draft",
            "published",
            "unpublished"
        ),
        nullable=False,
        default="draft"
    )

    # ==========================
    # EVENT OWNER
    # ==========================

    created_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # ==========================
    # TIMESTAMPS
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
    # RELATIONSHIPS
    # ==========================

    category = db.relationship(
        "EventCategory",
        backref="events"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[created_by],
        backref="created_events"
    )

    # ==========================
    # TO DICT
    # ==========================

    def to_dict(self):
        return {
            "id": self.id,

            "artist_id": self.artist_id,
            "venue_id": self.venue_id,
            "category_id": self.category_id,

            "title": self.title,
            "slug": self.slug,

            "description": self.description,
            "rules": self.rules,
            "faq": self.faq,

            "poster": self.poster,
            "banner": self.banner,

            "event_date": (
                self.event_date.isoformat()
                if self.event_date
                else None
            ),

            "start_time": (
                self.start_time.strftime("%H:%M:%S")
                if self.start_time
                else None
            ),

            "end_time": (
                self.end_time.strftime("%H:%M:%S")
                if self.end_time
                else None
            ),

            "min_age": self.min_age,

            "terms_url": self.terms_url,

            "publish_status": self.publish_status,

            "created_by": self.created_by,

            "created_at": self.created_at,
            "updated_at": self.updated_at
        }