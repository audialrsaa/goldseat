from flask import request, jsonify

from app.extensions import db
from app.models.venue import Venue
from app.services.storage_service import upload_image


# ==========================
# HELPER
# ==========================
def parse_venue_form(form):
    """
    Ambil & bersihkan field dari request.form.
    String kosong diubah jadi None supaya gak bikin error
    pas di-assign ke kolom Numeric/Integer di DB.
    """
    name = form.get("name")
    address = form.get("address") or None
    city = form.get("city") or None
    maps_url = form.get("maps_url") or None

    latitude_raw = form.get("latitude") or None
    longitude_raw = form.get("longitude") or None
    capacity_raw = form.get("capacity") or None

    errors = {}

    latitude = None
    if latitude_raw is not None:
        try:
            latitude = float(latitude_raw)
        except ValueError:
            errors["latitude"] = "Latitude harus berupa angka"

    longitude = None
    if longitude_raw is not None:
        try:
            longitude = float(longitude_raw)
        except ValueError:
            errors["longitude"] = "Longitude harus berupa angka"

    capacity = None
    if capacity_raw is not None:
        try:
            capacity = int(capacity_raw)
        except ValueError:
            errors["capacity"] = "Kapasitas harus berupa angka bulat"

    data = {
        "name": name,
        "address": address,
        "city": city,
        "maps_url": maps_url,
        "latitude": latitude,
        "longitude": longitude,
        "capacity": capacity,
    }

    return data, errors


# ==========================
# CREATE
# ==========================
def create_venue():

    data, errors = parse_venue_form(request.form)

    if not data["name"]:
        errors["name"] = "Nama venue wajib diisi"

    if errors:
        return jsonify({
            "status": "error",
            "message": "Data venue tidak valid",
            "errors": errors
        }), 400

    photo = request.files.get("photo")
    photo_url = None

    if photo:
        try:
            photo_url = upload_image(photo, "venues")
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Gagal mengunggah foto venue",
                "error": str(e)
            }), 500

    venue = Venue(
        name=data["name"],
        address=data["address"],
        city=data["city"],
        photo=photo_url,
        maps_url=data["maps_url"],
        latitude=data["latitude"],
        longitude=data["longitude"],
        capacity=data["capacity"],
    )

    try:
        db.session.add(venue)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Gagal menyimpan venue ke database",
            "error": str(e)
        }), 500

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

    data, errors = parse_venue_form(request.form)

    if errors:
        return jsonify({
            "status": "error",
            "message": "Data venue tidak valid",
            "errors": errors
        }), 400

    # hanya update field yang memang dikirim (biar gak nimpa
    # nilai lama dengan None kalau field-nya sengaja gak dikirim)
    if request.form.get("name") is not None:
        venue.name = data["name"] or venue.name

    if "address" in request.form:
        venue.address = data["address"]

    if "city" in request.form:
        venue.city = data["city"]

    if "maps_url" in request.form:
        venue.maps_url = data["maps_url"]

    if "latitude" in request.form:
        venue.latitude = data["latitude"]

    if "longitude" in request.form:
        venue.longitude = data["longitude"]

    if "capacity" in request.form:
        venue.capacity = data["capacity"]

    photo = request.files.get("photo")

    if photo:
        try:
            venue.photo = upload_image(photo, "venues")
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Gagal mengunggah foto venue",
                "error": str(e)
            }), 500

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Gagal memperbarui venue di database",
            "error": str(e)
        }), 500

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

    try:
        db.session.delete(venue)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Gagal menghapus venue",
            "error": str(e)
        }), 500

    return jsonify({
        "status": "success",
        "message": "Venue berhasil dihapus"
    }), 200