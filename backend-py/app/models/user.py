from app.extensions import db


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    role_id = db.Column(
        db.BigInteger,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=True
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    photo = db.Column(
        db.String(255),
        nullable=True
    )

    status = db.Column(
        db.Enum(
            "active",
            "suspended",
            "inactive"
        ),
        nullable=False,
        default="active"
    )

    email_verified_at = db.Column(
        db.DateTime,
        nullable=True
    )

    created_by = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=True
    )

    last_login_at = db.Column(
        db.DateTime,
        nullable=True
    )

    fcm_token = db.Column(
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

    # ==========================================
    # RELATIONSHIP USER -> USER
    # ==========================================

    creator = db.relationship(
        "User",
        remote_side=[id],
        foreign_keys=[created_by],
        backref="created_users"
    )

    # ==========================================
    # TO DICT
    # ==========================================

    def to_dict(self):
        return {
            "id": self.id,
            "role_id": self.role_id,
            "role": self.role.name, 
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "photo": self.photo,
            "status": self.status,
            "email_verified_at": self.email_verified_at,
            "created_by": self.created_by,
            "last_login_at": self.last_login_at,
            "fcm_token": self.fcm_token,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }