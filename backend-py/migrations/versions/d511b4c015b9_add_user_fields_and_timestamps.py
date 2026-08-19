"""add user fields and timestamps

Revision ID: d511b4c015b9
Revises: c851c3cd646b
Create Date: 2026-08-10 09:18:47.562629

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision = 'd511b4c015b9'
down_revision = 'c851c3cd646b'
branch_labels = None
depends_on = None


def upgrade():

    # ==========================
    # ROLES
    # ==========================

    with op.batch_alter_table(
        'roles',
        schema=None
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                'created_at',
                sa.DateTime(),
                server_default=sa.text('CURRENT_TIMESTAMP'),
                nullable=True
            )
        )

        batch_op.add_column(
            sa.Column(
                'updated_at',
                sa.DateTime(),
                server_default=sa.text('CURRENT_TIMESTAMP'),
                nullable=True
            )
        )


    # ==========================
    # USERS
    # ==========================

    with op.batch_alter_table(
        'users',
        schema=None
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                'email_verified_at',
                sa.DateTime(),
                nullable=True
            )
        )

        batch_op.add_column(
            sa.Column(
                'created_by',
                sa.BigInteger(),
                nullable=True
            )
        )

        batch_op.add_column(
            sa.Column(
                'last_login_at',
                sa.DateTime(),
                nullable=True
            )
        )

        batch_op.add_column(
            sa.Column(
                'fcm_token',
                sa.String(length=255),
                nullable=True
            )
        )

        batch_op.alter_column(
            'status',
            existing_type=mysql.ENUM(
                'active',
                'inactive',
                'suspended'
            ),
            nullable=False
        )

        batch_op.create_foreign_key(
            'fk_users_created_by',
            'users',
            ['created_by'],
            ['id']
        )


def downgrade():

    # ==========================
    # USERS
    # ==========================

    with op.batch_alter_table(
        'users',
        schema=None
    ) as batch_op:

        batch_op.drop_constraint(
            'fk_users_created_by',
            type_='foreignkey'
        )

        batch_op.alter_column(
            'status',
            existing_type=mysql.ENUM(
                'active',
                'inactive',
                'suspended'
            ),
            nullable=True
        )

        batch_op.drop_column('fcm_token')
        batch_op.drop_column('last_login_at')
        batch_op.drop_column('created_by')
        batch_op.drop_column('email_verified_at')


    # ==========================
    # ROLES
    # ==========================

    with op.batch_alter_table(
        'roles',
        schema=None
    ) as batch_op:

        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')