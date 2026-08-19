from flask_jwt_extended import (
    get_jwt_identity,
    get_jwt
)


def get_current_user_id():

    return int(
        get_jwt_identity()
    )


def get_current_role():

    claims = get_jwt()

    return claims.get("role")


def get_current_role_id():

    claims = get_jwt()

    return claims.get("role_id")
