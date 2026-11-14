from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    __table_args__ = (
        db.Index("idx_audit_logs_user_id", "user_id"),
    )

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # USER / ACTOR
    # =========================================================

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # =========================================================
    # ACTION
    # =========================================================

    action = db.Column(
        db.String(100),
        nullable=False
    )

    # =========================================================
    # SUBJECT
    # =========================================================
    # Contoh:
    # subject_type = "orders"
    # subject_id = 15

    subject_type = db.Column(
        db.String(100),
        nullable=False
    )

    subject_id = db.Column(
        db.BigInteger,
        nullable=False
    )

    # =========================================================
    # OLD VALUES
    # =========================================================

    old_values = db.Column(
        JSONB,
        nullable=True
    )

    # =========================================================
    # NEW VALUES
    # =========================================================

    new_values = db.Column(
        JSONB,
        nullable=True
    )

    # =========================================================
    # IP ADDRESS
    # =========================================================

    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    # =========================================================
    # TIMESTAMP
    # =========================================================

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    # =========================================================
    # RELATIONSHIP
    # =========================================================

    user = db.relationship(
        "User",
        backref=db.backref(
            "audit_logs",
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

            "action": self.action,

            "subject_type": self.subject_type,

            "subject_id": self.subject_id,

            "old_values": self.old_values,

            "new_values": self.new_values,

            "ip_address": self.ip_address,

            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }