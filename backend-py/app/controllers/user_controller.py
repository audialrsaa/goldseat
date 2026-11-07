from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_

from app.extensions import db, bcrypt
from app.models.user import User
from app.models.role import Role
from app.middleware.role_middleware import role_required


# =========================================================
# GET ALL USERS (super_admin only)
# =========================================================

@jwt_required()
@role_required("super_admin")
def get_users():
    claims = get_jwt()

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search", "", type=str)
    role_filter = request.args.get("role", "", type=str)
    status_filter = request.args.get("status", "", type=str)

    query = User.query

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.phone.ilike(search_pattern),
            )
        )

    if role_filter:
        role = Role.query.filter_by(name=role_filter).first()
        if role:
            query = query.filter(User.role_id == role.id)

    if status_filter:
        query = query.filter(User.status == status_filter)

    query = query.order_by(User.created_at.desc())

    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )

    users = [u.to_dict() for u in pagination.items]

    return jsonify({
        "status": "success",
        "data": {
            "users": users,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_pages": pagination.pages,
        }
    }), 200


# =========================================================
# GET DETAIL USER
# =========================================================

@jwt_required()
@role_required("super_admin")
def get_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": user.to_dict()
    }), 200


# =========================================================
# CREATE USER / STAFF
# =========================================================

@jwt_required()
@role_required("super_admin")
def create_user():
    data = request.get_json() or {}

    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    role_name = data.get("role", "user")
    status = data.get("status", "active")

    if not full_name or not email or not password:
        return jsonify({
            "status": "error",
            "message": "Full name, email, dan password wajib diisi"
        }), 400

    if len(password) < 8:
        return jsonify({
            "status": "error",
            "message": "Password minimal 8 karakter"
        }), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({
            "status": "error",
            "message": "Email sudah digunakan"
        }), 409

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({
            "status": "error",
            "message": f"Role '{role_name}' tidak ditemukan"
        }), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    admin_id = get_jwt_identity()

    new_user = User(
        role_id=role.id,
        full_name=full_name,
        email=email,
        phone=phone,
        password=hashed_password,
        status=status,
        created_by=admin_id,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User berhasil dibuat",
        "data": new_user.to_dict()
    }), 201


# =========================================================
# UPDATE USER
# =========================================================

@jwt_required()
@role_required("super_admin")
def update_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User tidak ditemukan"
        }), 404

    data = request.get_json() or {}

    if "full_name" in data:
        user.full_name = data["full_name"]

    if "email" in data and data["email"] != user.email:
        existing = User.query.filter_by(email=data["email"]).first()
        if existing:
            return jsonify({
                "status": "error",
                "message": "Email sudah digunakan"
            }), 409
        user.email = data["email"]

    if "phone" in data:
        user.phone = data["phone"]

    if "status" in data:
        user.status = data["status"]

    if "role" in data:
        role = Role.query.filter_by(name=data["role"]).first()
        if not role:
            return jsonify({
                "status": "error",
                "message": f"Role '{data['role']}' tidak ditemukan"
            }), 400
        user.role_id = role.id

    if "password" in data and data["password"]:
        if len(data["password"]) < 8:
            return jsonify({
                "status": "error",
                "message": "Password minimal 8 karakter"
            }), 400
        user.password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User berhasil diperbarui",
        "data": user.to_dict()
    }), 200


# =========================================================
# DELETE USER
# =========================================================

@jwt_required()
@role_required("super_admin")
def delete_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "status": "error",
            "message": "User tidak ditemukan"
        }), 404

    current_user_id = get_jwt_identity()
    if str(user.id) == str(current_user_id):
        return jsonify({
            "status": "error",
            "message": "Tidak dapat menghapus akun sendiri"
        }), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User berhasil dihapus"
    }), 200


# =========================================================
# GET ALL ROLES (helper untuk dropdown)
# =========================================================

@jwt_required()
@role_required("super_admin")
def get_roles():
    roles = Role.query.order_by(Role.name).all()

    return jsonify({
        "status": "success",
        "data": [r.to_dict() for r in roles]
    }), 200
