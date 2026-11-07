import os
import uuid

from supabase import create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL belum diset")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY belum diset")

if not SUPABASE_BUCKET:
    raise RuntimeError("SUPABASE_BUCKET belum diset")


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def upload_image(file, folder):
    """
    Upload file ke Supabase Storage.
    """

    if not file or not file.filename:
        return None

    # Ambil extension
    if "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    else:
        ext = "jpg"

    filename = f"{uuid.uuid4()}.{ext}"
    path = f"{folder}/{filename}"

    # Pastikan pointer file berada di awal
    file.seek(0)

    file_data = file.read()

    if not file_data:
        raise Exception("File foto kosong")

    content_type = file.content_type or "application/octet-stream"

    try:
        response = supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .upload(
                path,
                file_data,
                {
                    "content-type": content_type
                }
            )

        # Supabase Python client versi tertentu
        # mengembalikan object response tanpa .error.
        if hasattr(response, "error") and response.error:
            raise Exception(str(response.error))

        public_url = supabase.storage \
            .from_(SUPABASE_BUCKET) \
            .get_public_url(path)

        return public_url

    except Exception as e:
        print("SUPABASE UPLOAD ERROR:", repr(e))
        raise