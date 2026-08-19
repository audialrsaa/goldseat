from app.extensions import db


class Faq(db.Model):
    __tablename__ = "faqs"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    # =========================================================
    # QUESTION
    # =========================================================

    question = db.Column(
        db.Text,
        nullable=False
    )

    # =========================================================
    # ANSWER
    # =========================================================

    answer = db.Column(
        db.Text,
        nullable=False
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

            "question": self.question,

            "answer": self.answer,

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