"""remove waitlists table

Revision ID: 3cd91574395c
Revises: 300bb75f4ec9
Create Date: 2026-08-28 09:02:59.056898

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision = "3cd91574395c"
down_revision = "300bb75f4ec9"
branch_labels = None
depends_on = None


def upgrade():
    # =========================================================
    # REMOVE WAITLIST TABLE
    # =========================================================

    op.drop_table("waitlists")

    # =========================================================
    # REMOVE WAITLIST FROM NOTIFICATION TYPE
    # =========================================================

    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.alter_column(
            "type",
            existing_type=mysql.ENUM(
                "order_update",
                "promo",
                "system",
                "refund",
                "waitlist",
            ),
            type_=sa.Enum(
                "order_update",
                "promo",
                "system",
                "refund",
            ),
            existing_nullable=False,
        )


def downgrade():
    # =========================================================
    # RESTORE WAITLIST TABLE
    # =========================================================

    op.create_table(
        "waitlists",

        # -----------------------------------------------------
        # PRIMARY KEY
        # -----------------------------------------------------

        sa.Column(
            "id",
            sa.BigInteger(),
            nullable=False,
        ),

        # -----------------------------------------------------
        # TICKET CATEGORY
        # -----------------------------------------------------

        sa.Column(
            "ticket_category_id",
            sa.BigInteger(),
            nullable=False,
        ),

        # -----------------------------------------------------
        # USER
        # -----------------------------------------------------

        sa.Column(
            "user_id",
            sa.BigInteger(),
            nullable=False,
        ),

        # -----------------------------------------------------
        # STATUS
        # -----------------------------------------------------

        sa.Column(
            "status",
            mysql.ENUM(
                "waiting",
                "notified",
                "expired",
                "converted",
            ),
            nullable=False,
        ),

        # -----------------------------------------------------
        # NOTIFIED AT
        # -----------------------------------------------------

        sa.Column(
            "notified_at",
            sa.DateTime(),
            nullable=True,
        ),

        # -----------------------------------------------------
        # OFFER EXPIRES AT
        # -----------------------------------------------------

        sa.Column(
            "offer_expires_at",
            sa.DateTime(),
            nullable=True,
        ),

        # -----------------------------------------------------
        # CREATED AT
        # -----------------------------------------------------

        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),

        # -----------------------------------------------------
        # UPDATED AT
        # -----------------------------------------------------

        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),

        # -----------------------------------------------------
        # FOREIGN KEYS
        # -----------------------------------------------------

        sa.ForeignKeyConstraint(
            ["ticket_category_id"],
            ["ticket_categories.id"],
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),

        # -----------------------------------------------------
        # PRIMARY KEY
        # -----------------------------------------------------

        sa.PrimaryKeyConstraint("id"),
    )

    # =========================================================
    # RESTORE WAITLIST TO NOTIFICATION TYPE
    # =========================================================

    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.alter_column(
            "type",
            existing_type=sa.Enum(
                "order_update",
                "promo",
                "system",
                "refund",
            ),
            type_=mysql.ENUM(
                "order_update",
                "promo",
                "system",
                "refund",
                "waitlist",  
            ),
            existing_nullable=False,
        )