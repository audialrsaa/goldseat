from flask import request, jsonify

from app.extensions import db
from app.models.venue import Venue
from app.services.storage_service import upload_image


# ==========================
# CREATE
# ==========================
def create_venue():

    name = request.form.get("name")
    address = request.form.get("address")
    city = request.form.get("city")
    maps_url = request.form.get("maps_url")
    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")
    capacity = request.form.get("capacity")

    photo = request.files.get("photo")

    if not name:
        return jsonify({
            "status": "error",
            "message": "Nama venue wajib diisi"
        }), 400

    photo_url = None

    if photo:
        photo_url = upload_image(
            photo,
            "venues"
        )

    venue = Venue(
        name=name,
        address=address,
        city=city,
        photo=photo_url,
        maps_url=maps_url,
        latitude=latitude,
        longitude=longitude,
        capacity=capacity
    )

    db.session.add(venue)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Venue berhasil ditambahkan",
        "data": venue.to_dict()
    }), 201


# ==========================
# GET ALL
# ==========================
def get_venues():

    venues = Venue.query.order_by(
        Venue.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            venue.to_dict()
            for venue in venues
        ]
    }), 200


# ==========================
# GET DETAIL
# ==========================
def get_venue(id):

    venue = db.session.get(Venue, id)

    if not venue:
        return jsonify({
            "status": "error",
            "message": "Venue tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": venue.to_dict()
    }), 200


# ==========================
# UPDATE
# ==========================
def update_venue(id):

    venue = db.session.get(Venue, id)

    if not venue:
        return jsonify({
            "status": "error",
            "message": "Venue tidak ditemukan"
        }), 404

    venue.name = request.form.get(
        "name",
        venue.name
    )

    venue.address = request.form.get(
        "address",
        venue.address
    )

    venue.city = request.form.get(
        "city",
        venue.city
    )

    venue.maps_url = request.form.get(
        "maps_url",
        venue.maps_url
    )

    venue.latitude = request.form.get(
        "latitude",
        venue.latitude
    )

    venue.longitude = request.form.get(
        "longitude",
        venue.longitude
    )

    venue.capacity = request.form.get(
        "capacity",
        venue.capacity
    )

    photo = request.files.get("photo")

    if photo:
        venue.photo = upload_image(
            photo,
            "venues"
        )

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Venue berhasil diupdate",
        "data": venue.to_dict()
    }), 200


# ==========================
# DELETE
# ==========================
def delete_venue(id):

    venue = db.session.get(Venue, id)

    if not venue:
        return jsonify({
            "status": "error",
            "message": "Venue tidak ditemukan"
        }), 404

    db.session.delete(venue)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Venue berhasil dihapus"
    }), 200