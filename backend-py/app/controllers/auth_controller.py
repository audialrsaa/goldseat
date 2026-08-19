from datetime import datetime

from flask import request, jsonify

from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from app.extensions import db, bcrypt

from app.models.user import User
from app.models.role import Role


# =========================================================
# REGISTER
# =========================================================

def register():

    data = request.get_json() or {}

    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    # ==========================
    # VALIDASI FIELD
    # ==========================

    if not full_name or not email or not password:

        return jsonify({
            "status": "error",
            "message": "Full name, email, dan password wajib diisi"
        }), 400

    # ==========================
    # VALIDASI PASSWORD
    # ==========================

    if len(password) < 8:

        return jsonify({
            "status": "error",
            "message": "Password minimal 8 karakter"
        }), 400

    # ==========================
    # CEK EMAIL
    # ==========================

    user = User.query.filter_by(
        email=email
    ).first()

    if user:

        return jsonify({
            "status": "error",
            "message": "Email sudah digunakan"
        }), 409

    # ==========================
    # ROLE USER
    # ==========================

    role = Role.query.filter_by(
        name="user"
    ).first()

    if not role:

        return jsonify({
            "status": "error",
            "message": "Role user belum tersedia"
        }), 500

    # ==========================
    # HASH PASSWORD
    # ==========================

    hashed_password = (
        bcrypt
        .generate_password_hash(password)
        .decode("utf-8")
    )

    # ==========================
    # CREATE USER
    # ==========================

    new_user = User(
        role_id=role.id,
        full_name=full_name,
        email=email,
        phone=phone,
        password=hashed_password,
        status="active",
        created_by=None
    )

    db.session.add(new_user)

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Register berhasil",
        "data": new_user.to_dict()
    }), 201


# =========================================================
# LOGIN
# =========================================================

def login():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    # ==========================
    # VALIDASI
    # ==========================

    if not email or not password:

        return jsonify({
            "status": "error",
            "message": "Email dan password wajib diisi"
        }), 400

    # ==========================
    # CARI USER
    # ==========================

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return jsonify({
            "status": "error",
            "message": "Email atau password salah"
        }), 401

    # ==========================
    # CEK PASSWORD
    # ==========================

    if not bcrypt.check_password_hash(
        user.password,
        password
    ):

        return jsonify({
            "status": "error",
            "message": "Email atau password salah"
        }), 401

    # ==========================
    # CEK STATUS
    # ==========================

    if user.status != "active":

        return jsonify({
            "status": "error",
            "message": "Akun tidak aktif"
        }), 403

    # ==========================
    # UPDATE LAST LOGIN
    # ==========================

    user.last_login_at = datetime.utcnow()

    db.session.commit()

    # ==========================
    # JWT
    # ==========================

    access_token = create_access_token(

        identity=str(user.id),

        additional_claims={
            "role": user.role.name,
            "role_id": user.role_id
        }
    )

    return jsonify({
        "status": "success",
        "message": "Login berhasil",

        "data": {

            "user": user.to_dict(),

            "access_token": access_token,

            "token_type": "Bearer"
        }

    }), 200


# =========================================================
# ME
# =========================================================

@jwt_required()
def me():

    user_id = get_jwt_identity()

    user = db.session.get(
        User,
        user_id
    )

    if not user:

        return jsonify({
            "status": "error",
            "message": "User tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": user.to_dict()
    }), 200