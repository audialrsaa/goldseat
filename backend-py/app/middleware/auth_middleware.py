from functools import wraps
from flask_jwt_extended import verify_jwt_in_request
from flask import jsonify


def jwt_auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)

        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Unauthorized",
                "error": str(e)
            }), 401

    return wrapper