from flask import request, jsonify

from app.extensions import db
from app.models.artist import Artist
from app.services.storage_service import upload_image


def create_artist():

    name = request.form.get("name")
    description = request.form.get("description")

    photo = request.files.get("photo")

    if not name:
        return jsonify({
            "status": "error",
            "message": "Name wajib diisi"
        }), 400

    photo_url = None

    if photo:
        photo_url = upload_image(photo, "artists")

    artist = Artist(
        name=name,
        description=description,
        photo=photo_url
    )

    db.session.add(artist)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Artist berhasil ditambahkan",
        "data": artist.to_dict()
    }), 201


def get_artists():

    artists = Artist.query.order_by(
        Artist.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            artist.to_dict()
            for artist in artists
        ]
    }), 200


def get_artist(id):

    artist = db.session.get(Artist, id)

    if not artist:
        return jsonify({
            "status": "error",
            "message": "Artist tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": artist.to_dict()
    }), 200


def update_artist(id):

    artist = db.session.get(Artist, id)

    if not artist:
        return jsonify({
            "status": "error",
            "message": "Artist tidak ditemukan"
        }), 404

    artist.name = request.form.get(
        "name",
        artist.name
    )

    artist.description = request.form.get(
        "description",
        artist.description
    )

    photo = request.files.get("photo")

    if photo:
        artist.photo = upload_image(
            photo,
            "artists"
        )

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Artist berhasil diupdate",
        "data": artist.to_dict()
    }), 200


def delete_artist(id):

    artist = db.session.get(Artist, id)

    if not artist:
        return jsonify({
            "status": "error",
            "message": "Artist tidak ditemukan"
        }), 404

    db.session.delete(artist)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Artist berhasil dihapus"
    }), 200
