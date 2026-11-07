from functools import wraps
from flask_jwt_extended import verify_jwt_in_request
from flask import jsonify


def jwt_auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Unauthorized",
                "error": str(e)
            }), 401

        # dipanggil DI LUAR try/except supaya error dari controller
        # (create_venue, update_venue, dll) tidak ikut ketangkep
        # dan salah dilaporkan sebagai "Unauthorized"
        return fn(*args, **kwargs)

    return wrapper