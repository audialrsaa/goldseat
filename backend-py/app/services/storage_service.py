import os
import uuid

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_image(file, folder):
    """
    Upload file ke Supabase Storage.

    folder:
    - artist
    - event-posters
    - event-banners
    - seatmaps
    - users
    """

    if file is None:
        return None

    ext = file.filename.rsplit(".", 1)[-1].lower()

    filename = f"{uuid.uuid4()}.{ext}"

    path = f"{folder}/{filename}"

    file.seek(0)

    response = supabase.storage.from_(SUPABASE_BUCKET).upload(
        path,
        file.read(),
        {
            "content-type": file.content_type
        }
    )

    if hasattr(response, "error") and response.error:
        raise Exception(response.error)

    public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(path)

    return public_url