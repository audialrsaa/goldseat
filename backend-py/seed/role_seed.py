import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

from run import app
from app.extensions import db, bcrypt
from app.models.role import Role
from app.models.user import User

roles = [
    {
        "id": 1,
        "name": "super_admin",
        "description": "Full access"
    },
    {
        "id": 2,
        "name": "event_manager",
        "description": "Manage own events"
    },
    {
        "id": 3,
        "name": "cashier",
        "description": "Offline ticket sales"
    },
    {
        "id": 4,
        "name": "checkin_staff",
        "description": "QR Check-in"
    },
    {
        "id": 5,
        "name": "user",
        "description": "Customer"
    }
]

with app.app_context():

    for role in roles:
        exist = Role.query.filter_by(
            name=role["name"]
        ).first()

        if not exist:
            db.session.add(Role(**role))

    db.session.commit()

    # =====================================================
    # DEVELOPMENT USERS
    # Hanya untuk development.
    # =====================================================

    dev_users = [
        {
            "email": "admin@goldseat.dev",
            "full_name": "Super Admin",
            "role_name": "super_admin",
            "password": "password123"
        },
        {
            "email": "manager@goldseat.dev",
            "full_name": "Event Manager",
            "role_name": "event_manager",
            "password": "password123"
        },
        {
            "email": "cashier@goldseat.dev",
            "full_name": "Cashier",
            "role_name": "cashier",
            "password": "password123"
        },
        {
            "email": "staff@goldseat.dev",
            "full_name": "Checkin Staff",
            "role_name": "checkin_staff",
            "password": "password123"
        },
        {
            "email": "user@goldseat.dev",
            "full_name": "Regular User",
            "role_name": "user",
            "password": "password123"
        }
    ]

    for dev_user in dev_users:

        exist = User.query.filter_by(
            email=dev_user["email"]
        ).first()

        if not exist:

            role = Role.query.filter_by(
                name=dev_user["role_name"]
            ).first()

            if not role:
                continue

            hashed_password = (
                bcrypt
                .generate_password_hash(
                    dev_user["password"]
                )
                .decode("utf-8")
            )

            user = User(
                role_id=role.id,
                full_name=dev_user["full_name"],
                email=dev_user["email"],
                password=hashed_password,
                status="active"
            )

            db.session.add(user)

    db.session.commit()

print("Seed completed!")
