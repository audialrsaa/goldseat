from datetime import datetime

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from slugify import slugify

from app.extensions import db

from app.models.event import Event
from app.models.artist import Artist
from app.models.venue import Venue
from app.models.event_category import EventCategory

from app.services.storage_service import upload_image


# =========================================================
# GET ALL EVENTS
# =========================================================

def get_events():

    events = Event.query.order_by(
        Event.id.desc()
    ).all()

    return jsonify({
        "status": "success",
        "data": [
            event.to_dict()
            for event in events
        ]
    }), 200


# =========================================================
# GET DETAIL EVENT
# =========================================================

def get_event(id):

    event = db.session.get(Event, id)

    if not event:
        return jsonify({
            "status": "error",
            "message": "Event tidak ditemukan"
        }), 404

    return jsonify({
        "status": "success",
        "data": event.to_dict()
    }), 200


# =========================================================
# CREATE EVENT
# =========================================================

def create_event():

    form = request.form

    artist_id = form.get("artist_id")
    venue_id = form.get("venue_id")
    category_id = form.get("category_id")

    title = form.get("title")
    description = form.get("description")
    rules = form.get("rules")
    faq = form.get("faq")

    event_date = form.get("event_date")
    start_time = form.get("start_time")
    end_time = form.get("end_time")

    min_age = form.get("min_age")
    terms_url = form.get("terms_url")

    publish_status = form.get(
        "publish_status",
        "draft"
    )


    # =====================================================
    # VALIDASI FIELD WAJIB
    # =====================================================

    if not artist_id:
        return jsonify({
            "status": "error",
            "message": "Artist wajib dipilih"
        }), 400

    if not venue_id:
        return jsonify({
            "status": "error",
            "message": "Venue wajib dipilih"
        }), 400

    if not category_id:
        return jsonify({
            "status": "error",
            "message": "Kategori event wajib dipilih"
        }), 400

    if not title:
        return jsonify({
            "status": "error",
            "message": "Title wajib diisi"
        }), 400

    if not event_date:
        return jsonify({
            "status": "error",
            "message": "Tanggal event wajib diisi"
        }), 400

    if not start_time:
        return jsonify({
            "status": "error",
            "message": "Jam mulai event wajib diisi"
        }), 400


    # =====================================================
    # CEK ARTIST
    # =====================================================

    artist = db.session.get(
        Artist,
        artist_id
    )

    if not artist:
        return jsonify({
            "status": "error",
            "message": "Artist tidak ditemukan"
        }), 404


    # =====================================================
    # CEK VENUE
    # =====================================================

    venue = db.session.get(
        Venue,
        venue_id
    )

    if not venue:
        return jsonify({
            "status": "error",
            "message": "Venue tidak ditemukan"
        }), 404


    # =====================================================
    # CEK CATEGORY
    # =====================================================

    category = db.session.get(
        EventCategory,
        category_id
    )

    if not category:
        return jsonify({
            "status": "error",
            "message": "Kategori event tidak ditemukan"
        }), 404


    # =====================================================
    # VALIDASI PUBLISH STATUS
    # =====================================================

    allowed_status = [
        "draft",
        "published",
        "unpublished"
    ]

    if publish_status not in allowed_status:
        return jsonify({
            "status": "error",
            "message": "Publish status tidak valid"
        }), 400


    # =====================================================
    # VALIDASI TANGGAL
    # =====================================================

    try:
        event_date = datetime.strptime(
            event_date,
            "%Y-%m-%d"
        ).date()

    except ValueError:
        return jsonify({
            "status": "error",
            "message": "Format event_date harus YYYY-MM-DD"
        }), 400


    # =====================================================
    # VALIDASI JAM
    # =====================================================

    try:
        start_time = datetime.strptime(
            start_time,
            "%H:%M:%S"
        ).time()

    except ValueError:

        try:
            start_time = datetime.strptime(
                start_time,
                "%H:%M"
            ).time()

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Format start_time harus HH:MM atau HH:MM:SS"
            }), 400


    # =====================================================
    # END TIME
    # =====================================================

    if end_time:

        try:
            end_time = datetime.strptime(
                end_time,
                "%H:%M:%S"
            ).time()

        except ValueError:

            try:
                end_time = datetime.strptime(
                    end_time,
                    "%H:%M"
                ).time()

            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Format end_time harus HH:MM atau HH:MM:SS"
                }), 400


    # =====================================================
    # MIN AGE
    # =====================================================

    if min_age:

        try:
            min_age = int(min_age)

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "min_age harus berupa angka"
            }), 400

    else:
        min_age = None


    # =====================================================
    # GENERATE SLUG
    # =====================================================

    slug = slugify(title)

    existing_slug = Event.query.filter_by(
        slug=slug
    ).first()

    if existing_slug:

        return jsonify({
            "status": "error",
            "message": "Slug event sudah digunakan"
        }), 409


    # =====================================================
    # AMBIL USER LOGIN
    # =====================================================

    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "User tidak terautentikasi"
        }), 401


    # =====================================================
    # UPLOAD POSTER
    # =====================================================

    poster = request.files.get("poster")
    poster_url = None

    if poster:
        poster_url = upload_image(
            poster,
            "event-posters"
        )


    # =====================================================
    # UPLOAD BANNER
    # =====================================================

    banner = request.files.get("banner")
    banner_url = None

    if banner:
        banner_url = upload_image(
            banner,
            "event-banners"
        )


    # =====================================================
    # CREATE EVENT
    # =====================================================

    event = Event(
        artist_id=artist_id,
        venue_id=venue_id,
        category_id=category_id,

        title=title,
        slug=slug,

        description=description,
        rules=rules,
        faq=faq,

        poster=poster_url,
        banner=banner_url,

        event_date=event_date,
        start_time=start_time,
        end_time=end_time,

        min_age=min_age,
        terms_url=terms_url,

        publish_status=publish_status,

        created_by=user_id
    )

    db.session.add(event)
    db.session.commit()


    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({
        "status": "success",
        "message": "Event berhasil ditambahkan",
        "data": event.to_dict()
    }), 201


# =========================================================
# UPDATE EVENT
# =========================================================

def update_event(id):

    event = db.session.get(
        Event,
        id
    )

    if not event:
        return jsonify({
            "status": "error",
            "message": "Event tidak ditemukan"
        }), 404


    form = request.form


    # =====================================================
    # ARTIST
    # =====================================================

    artist_id = form.get("artist_id")

    if artist_id:

        artist = db.session.get(
            Artist,
            artist_id
        )

        if not artist:
            return jsonify({
                "status": "error",
                "message": "Artist tidak ditemukan"
            }), 404

        event.artist_id = artist_id


    # =====================================================
    # VENUE
    # =====================================================

    venue_id = form.get("venue_id")

    if venue_id:

        venue = db.session.get(
            Venue,
            venue_id
        )

        if not venue:
            return jsonify({
                "status": "error",
                "message": "Venue tidak ditemukan"
            }), 404

        event.venue_id = venue_id


    # =====================================================
    # CATEGORY
    # =====================================================

    category_id = form.get("category_id")

    if category_id:

        category = db.session.get(
            EventCategory,
            category_id
        )

        if not category:
            return jsonify({
                "status": "error",
                "message": "Kategori event tidak ditemukan"
            }), 404

        event.category_id = category_id


    # =====================================================
    # TITLE + SLUG
    # =====================================================

    title = form.get("title")

    if title:

        event.title = title

        new_slug = slugify(title)

        existing_slug = Event.query.filter(
            Event.slug == new_slug,
            Event.id != id
        ).first()

        if existing_slug:

            return jsonify({
                "status": "error",
                "message": "Slug event sudah digunakan"
            }), 409

        event.slug = new_slug


    # =====================================================
    # TEXT FIELD
    # =====================================================

    if "description" in form:
        event.description = form.get("description")

    if "rules" in form:
        event.rules = form.get("rules")

    if "faq" in form:
        event.faq = form.get("faq")

    if "terms_url" in form:
        event.terms_url = form.get("terms_url")


    # =====================================================
    # EVENT DATE
    # =====================================================

    event_date = form.get("event_date")

    if event_date:

        try:
            event.event_date = datetime.strptime(
                event_date,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Format event_date harus YYYY-MM-DD"
            }), 400


    # =====================================================
    # START TIME
    # =====================================================

    start_time = form.get("start_time")

    if start_time:

        try:
            event.start_time = datetime.strptime(
                start_time,
                "%H:%M:%S"
            ).time()

        except ValueError:

            try:
                event.start_time = datetime.strptime(
                    start_time,
                    "%H:%M"
                ).time()

            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Format start_time tidak valid"
                }), 400


    # =====================================================
    # END TIME
    # =====================================================

    if "end_time" in form:

        end_time = form.get("end_time")

        if end_time:

            try:
                event.end_time = datetime.strptime(
                    end_time,
                    "%H:%M:%S"
                ).time()

            except ValueError:

                try:
                    event.end_time = datetime.strptime(
                        end_time,
                        "%H:%M"
                    ).time()

                except ValueError:
                    return jsonify({
                        "status": "error",
                        "message": "Format end_time tidak valid"
                    }), 400

        else:
            event.end_time = None


    # =====================================================
    # MIN AGE
    # =====================================================

    if "min_age" in form:

        min_age = form.get("min_age")

        if min_age:

            try:
                event.min_age = int(min_age)

            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "min_age harus berupa angka"
                }), 400

        else:
            event.min_age = None


    # =====================================================
    # PUBLISH STATUS
    # =====================================================

    publish_status = form.get("publish_status")

    if publish_status:

        allowed_status = [
            "draft",
            "published",
            "unpublished"
        ]

        if publish_status not in allowed_status:
            return jsonify({
                "status": "error",
                "message": "Publish status tidak valid"
            }), 400

        event.publish_status = publish_status


    # =====================================================
    # UPLOAD POSTER
    # =====================================================

    poster = request.files.get("poster")

    if poster:

        event.poster = upload_image(
            poster,
            "event-posters"
        )


    # =====================================================
    # UPLOAD BANNER
    # =====================================================

    banner = request.files.get("banner")

    if banner:

        event.banner = upload_image(
            banner,
            "event-banners"
        )


    # =====================================================
    # SAVE
    # =====================================================

    db.session.commit()


    return jsonify({
        "status": "success",
        "message": "Event berhasil diupdate",
        "data": event.to_dict()
    }), 200


# =========================================================
# DELETE EVENT
# =========================================================

def delete_event(id):

    event = db.session.get(
        Event,
        id
    )

    if not event:
        return jsonify({
            "status": "error",
            "message": "Event tidak ditemukan"
        }), 404


    db.session.delete(event)
    db.session.commit()


    return jsonify({
        "status": "success",
        "message": "Event berhasil dihapus"
    }), 200